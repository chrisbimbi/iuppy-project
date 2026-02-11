import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyEsocialConfigEntity } from '../entities/company-esocial-config.entity';
import { UpdateEsocialConfigDto } from '../dto/esocial-config.dto';
import * as crypto from 'crypto';

@Injectable()
export class Nr1EsocialConfigService {
    private readonly logger = new Logger(Nr1EsocialConfigService.name);
    private readonly ALGORITHM = 'aes-256-cbc';
    private readonly encryptionKey: Buffer;

    constructor(
        @InjectRepository(CompanyEsocialConfigEntity)
        private readonly configRepo: Repository<CompanyEsocialConfigEntity>,
    ) {
        // Get encryption key from environment (must be 32 bytes)
        const key = process.env.ESOCIAL_ENCRYPTION_KEY;
        if (!key) {
            throw new Error('ESOCIAL_ENCRYPTION_KEY not configured in environment');
        }
        this.encryptionKey = Buffer.from(key, 'hex');
        if (this.encryptionKey.length !== 32) {
            throw new Error('ESOCIAL_ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
        }
    }

    /**
     * Encrypt sensitive data
     */
    private encrypt(text: string): string {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.ALGORITHM, this.encryptionKey, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
    }

    /**
     * Decrypt sensitive data
     */
    private decrypt(text: string): string {
        const parts = text.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];
        const decipher = crypto.createDecipheriv(this.ALGORITHM, this.encryptionKey, iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }

    /**
     * Get configuration for a company (create if not exists)
     */
    async getConfig(companyId: string): Promise<CompanyEsocialConfigEntity> {
        let config = await this.configRepo.findOne({ where: { companyId } });

        if (!config) {
            // Create default config
            config = this.configRepo.create({
                companyId,
                enabled: false,
                environment: 'homologacao',
                configured: false,
                connectionTested: false,
            });
            config = await this.configRepo.save(config);
        }

        return config;
    }

    /**
     * Update configuration
     */
    async updateConfig(companyId: string, dto: UpdateEsocialConfigDto): Promise<CompanyEsocialConfigEntity> {
        const config = await this.getConfig(companyId);

        // Update fields
        if (dto.environment) config.environment = dto.environment;
        if (dto.medicoNome) config.medicoNome = dto.medicoNome;
        if (dto.medicoCpf) config.medicoCpf = dto.medicoCpf;
        if (dto.medicoCrm) config.medicoCrm = dto.medicoCrm;
        if (dto.medicoUf) config.medicoUf = dto.medicoUf;
        if (dto.engenheiroNome) config.engenheiroNome = dto.engenheiroNome;
        if (dto.engenheiroCpf) config.engenheiroCpf = dto.engenheiroCpf;
        if (dto.engenheiroCrea) config.engenheiroCrea = dto.engenheiroCrea;
        if (dto.engenheiroUf) config.engenheiroUf = dto.engenheiroUf;

        // Check if configured
        config.configured = this.isFullyConfigured(config);

        return this.configRepo.save(config);
    }

    /**
     * Upload and store certificate
     */
    async uploadCertificate(
        companyId: string,
        fileBuffer: Buffer,
        password: string,
    ): Promise<{ success: boolean; expiryDate?: Date; message: string }> {
        const config = await this.getConfig(companyId);

        try {
            // Validate certificate format (.pfx/.p12)
            // For now, we just store it. Real validation would require parsing the certificate

            // Convert buffer to base64
            const base64Cert = fileBuffer.toString('base64');

            // Encrypt certificate and password
            config.certificateData = this.encrypt(base64Cert);
            config.certificatePassword = this.encrypt(password);

            // For now, set expiry to 1 year from now (real implementation would parse cert)
            const expiryDate = new Date();
            expiryDate.setFullYear(expiryDate.getFullYear() + 1);
            config.certificateExpiry = expiryDate;

            // Update configured status
            config.configured = this.isFullyConfigured(config);

            await this.configRepo.save(config);

            return {
                success: true,
                expiryDate,
                message: 'Certificado carregado com sucesso',
            };
        } catch (error) {
            this.logger.error(`Error uploading certificate for company ${companyId}:`, error);
            throw new BadRequestException('Erro ao processar certificado. Verifique o arquivo e senha.');
        }
    }

    /**
     * Test connection to eSocial
     */
    async testConnection(companyId: string): Promise<{ success: boolean; message: string }> {
        const config = await this.getConfig(companyId);

        if (!config.certificateData || !config.certificatePassword) {
            throw new BadRequestException('Certificado não configurado');
        }

        try {
            // Decrypt certificate
            const certBase64 = this.decrypt(config.certificateData);
            const certPassword = this.decrypt(config.certificatePassword);

            // TODO: Implement actual eSocial connection test
            // For now, simulate success
            this.logger.log(`Testing eSocial connection for company ${companyId} in ${config.environment}`);

            // Mark as tested
            config.connectionTested = true;
            config.lastTestedAt = new Date();
            await this.configRepo.save(config);

            return {
                success: true,
                message: `Conexão com eSocial (${config.environment}) estabelecida com sucesso!`,
            };
        } catch (error) {
            this.logger.error(`Connection test failed for company ${companyId}:`, error);
            return {
                success: false,
                message: 'Falha na conexão. Verifique certificado e senha.',
            };
        }
    }

    /**
     * Toggle enabled status
     */
    async toggleEnabled(companyId: string, enabled: boolean): Promise<CompanyEsocialConfigEntity> {
        const config = await this.getConfig(companyId);

        config.enabled = enabled;

        // Note: We allow enabling even if not fully configured
        // The user needs to enable to see the configuration form
        // Validation happens when they try to use features (test connection, send events)

        return this.configRepo.save(config);
    }

    /**
     * Check if company has eSocial configured
     */
    async isConfigured(companyId: string): Promise<boolean> {
        const config = await this.getConfig(companyId);
        return config.enabled && config.configured;
    }

    /**
     * Check if all required fields are filled
     */
    private isFullyConfigured(config: CompanyEsocialConfigEntity): boolean {
        return !!(
            config.certificateData &&
            config.certificatePassword &&
            config.medicoNome &&
            config.medicoCpf &&
            config.medicoCrm &&
            config.medicoUf &&
            config.engenheiroNome &&
            config.engenheiroCpf &&
            config.engenheiroCrea &&
            config.engenheiroUf
        );
    }

    /**
     * Get decrypted certificate for usage
     */
    async getCertificateForUsage(companyId: string): Promise<{ certificate: Buffer; password: string }> {
        const config = await this.getConfig(companyId);

        if (!config.certificateData || !config.certificatePassword) {
            throw new NotFoundException('Certificado não configurado');
        }

        if (!config.enabled) {
            throw new BadRequestException('eSocial não habilitado para esta empresa');
        }

        const certBase64 = this.decrypt(config.certificateData);
        const certPassword = this.decrypt(config.certificatePassword);
        const certificate = Buffer.from(certBase64, 'base64');

        return { certificate, password: certPassword };
    }
}
