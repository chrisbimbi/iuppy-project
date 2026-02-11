import {
    Controller,
    Get,
    Put,
    Post,
    Patch,
    Body,
    Req,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAccessGuard } from '../../../auth/guards/jwt-access.guard';
import { AuthenticatedRequest } from '../../../common/types/authenticated-request.interface';
import { Nr1EsocialConfigService } from '../services/nr1-esocial-config.service';
import { UpdateEsocialConfigDto, ToggleEsocialDto } from '../dto/esocial-config.dto';

@Controller('nr1/esocial/config')
@UseGuards(JwtAccessGuard)
export class Nr1EsocialConfigController {
    constructor(
        private readonly configService: Nr1EsocialConfigService,
    ) { }

    /**
     * GET /nr1/esocial/config
     * Get eSocial configuration for current company
     */
    @Get()
    async getConfig(@Req() req: AuthenticatedRequest) {
        const config = await this.configService.getConfig(req.user.companyId);

        // Remove sensitive data before sending to frontend
        return {
            ...config,
            certificateData: config.certificateData ? '***ENCRYPTED***' : null,
            certificatePassword: config.certificatePassword ? '***ENCRYPTED***' : null,
        };
    }

    /**
     * PUT /nr1/esocial/config
     * Update eSocial configuration
     */
    @Put()
    async updateConfig(
        @Req() req: AuthenticatedRequest,
        @Body() dto: UpdateEsocialConfigDto,
    ) {
        const config = await this.configService.updateConfig(req.user.companyId, dto);

        return {
            ...config,
            certificateData: config.certificateData ? '***ENCRYPTED***' : null,
            certificatePassword: config.certificatePassword ? '***ENCRYPTED***' : null,
        };
    }

    /**
     * POST /nr1/esocial/config/certificate
     * Upload certificate file (.pfx)
     */
    @Post('certificate')
    @UseInterceptors(FileInterceptor('file'))
    async uploadCertificate(
        @Req() req: AuthenticatedRequest,
        @UploadedFile() file: Express.Multer.File,
        @Body('password') password: string,
    ) {
        console.log('📁 Upload certificate called');
        console.log('File:', file ? `${file.originalname} (${file.size} bytes)` : 'NO FILE');
        console.log('Password:', password ? '***PROVIDED***' : 'NO PASSWORD');
        console.log('Body:', req.body);

        if (!file) {
            throw new BadRequestException('Arquivo de certificado não fornecido');
        }

        if (!password) {
            throw new BadRequestException('Senha do certificado não fornecida');
        }

        // Validate file extension
        const allowedExtensions = ['.pfx', '.p12'];
        const fileExt = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));

        if (!allowedExtensions.includes(fileExt)) {
            throw new BadRequestException('Formato de arquivo inválido. Use .pfx ou .p12');
        }

        return this.configService.uploadCertificate(
            req.user.companyId,
            file.buffer,
            password,
        );
    }

    /**
     * POST /nr1/esocial/config/test
     * Test connection to eSocial
     */
    @Post('test')
    async testConnection(@Req() req: AuthenticatedRequest) {
        return this.configService.testConnection(req.user.companyId);
    }

    /**
     * PATCH /nr1/esocial/config/toggle
     * Enable/disable eSocial integration
     */
    @Patch('toggle')
    async toggleEnabled(
        @Req() req: AuthenticatedRequest,
        @Body() dto: ToggleEsocialDto,
    ) {
        const config = await this.configService.toggleEnabled(req.user.companyId, dto.enabled);

        return {
            ...config,
            certificateData: config.certificateData ? '***ENCRYPTED***' : null,
            certificatePassword: config.certificatePassword ? '***ENCRYPTED***' : null,
        };
    }

    /**
     * GET /nr1/esocial/config/status
     * Check if eSocial is configured for current company
     */
    @Get('status')
    async getStatus(@Req() req: AuthenticatedRequest) {
        const isConfigured = await this.configService.isConfigured(req.user.companyId);
        const config = await this.configService.getConfig(req.user.companyId);

        return {
            isConfigured,
            enabled: config.enabled,
            environment: config.environment,
            connectionTested: config.connectionTested,
            certificateExpiry: config.certificateExpiry,
        };
    }
}
