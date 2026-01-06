import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class SecretsVaultService {
    private readonly algorithm = 'aes-256-gcm';
    private readonly masterKey: Buffer;
    private readonly logger = new Logger(SecretsVaultService.name);

    constructor(private configService: ConfigService) {
        const keyHex = this.configService.get<string>('INTEGRATIONS_MASTER_KEY');
        if (!keyHex) {
            this.logger.warn('INTEGRATIONS_MASTER_KEY is not set. Helper will fail if used.');
            // Generate a dummy key for dev startup if missing, but log warning
            this.masterKey = crypto.randomBytes(32);
        } else {
            this.masterKey = Buffer.from(keyHex, 'hex');
        }
    }

    encrypt(text: string): { content: string; iv: string; authTag: string } {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.algorithm, this.masterKey, iv);

        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const authTag = cipher.getAuthTag().toString('hex');

        return {
            content: encrypted,
            iv: iv.toString('hex'),
            authTag,
        };
    }

    decrypt(encrypted: { content: string; iv: string; authTag: string }): string {
        const decipher = crypto.createDecipheriv(
            this.algorithm,
            this.masterKey,
            Buffer.from(encrypted.iv, 'hex')
        );

        decipher.setAuthTag(Buffer.from(encrypted.authTag, 'hex'));

        let decrypted = decipher.update(encrypted.content, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }
}
