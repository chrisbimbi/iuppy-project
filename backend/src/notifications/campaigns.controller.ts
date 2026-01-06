import {
    Controller,
    Get,
    Post,
    Param,
    Body,
    UseGuards,
    Req,
} from '@nestjs/common';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { AuthenticatedRequest } from '../common/types/authenticated-request.interface';
import { CampaignsService } from './campaigns.service';

@Controller('communications/campaigns')
export class CampaignsController {
    constructor(private readonly campaignsService: CampaignsService) { }

    @Get()
    @UseGuards(JwtAccessGuard)
    async list(@Req() req: AuthenticatedRequest) {
        return this.campaignsService.list(req.user.companyId);
    }

    @Post()
    @UseGuards(JwtAccessGuard)
    async upsert(@Req() req: AuthenticatedRequest, @Body() body: any) {
        return this.campaignsService.upsert(req.user.companyId, body);
    }

    @Get(':id/stats')
    @UseGuards(JwtAccessGuard)
    async stats(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
        return this.campaignsService.getStats(req.user.companyId, id);
    }

    @Post(':id/send')
    @UseGuards(JwtAccessGuard)
    async send(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
        return this.campaignsService.sendNow(req.user.companyId, id);
    }
}
