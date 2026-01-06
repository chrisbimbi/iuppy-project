import {
    Controller,
    Get,
    Post,
    Param,
    UseGuards,
    Req,
    Body,
} from '@nestjs/common';
import { JwtAccessGuard } from '../../../auth/guards/jwt-access.guard';
import { AuthenticatedRequest } from '../../../common/types/authenticated-request.interface';
import { EvidenceVaultService } from '../services/evidence-vault.service';
import { EvidenceType } from '../entities/nr1-evidence-file.entity';

@Controller('nr1/evidence')
export class EvidenceVaultController {
    constructor(private readonly vaultService: EvidenceVaultService) { }

    @Get()
    @UseGuards(JwtAccessGuard)
    async listEvidence(@Req() req: AuthenticatedRequest) {
        return this.vaultService.listEvidence(req.user.companyId);
    }

    @Post()
    @UseGuards(JwtAccessGuard)
    async manuallyStoreEvidence(
        @Req() req: AuthenticatedRequest,
        @Body() body: { type: EvidenceType, url: string, contentStub: string }
    ) {
        // Endpoint for manual testing or manual uploads
        // return this.vaultService.storeEvidence(req.user.companyId, body.type, body.url, body.contentStub || 'dummy content');
        return null;
    }

    @Post(':id/sign')
    @UseGuards(JwtAccessGuard)
    async signEvidence(
        @Req() req: AuthenticatedRequest,
        @Param('id') id: string,
    ) {
        return this.vaultService.signEvidence(req.user.companyId, id);
    }

    @Get('audit')
    @UseGuards(JwtAccessGuard)
    async getAuditBundle(@Req() req: AuthenticatedRequest) {
        return this.vaultService.generateAuditBundle(req.user.companyId);
    }
}
