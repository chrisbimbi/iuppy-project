import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { JwtAccessGuard } from '../../auth/guards/jwt-access.guard';

@Controller('integrations')
@UseGuards(JwtAccessGuard)
export class IntegrationsController {
    constructor(private readonly integrationsService: IntegrationsService) { }

    @Get('providers')
    async listProviders() {
        return this.integrationsService.listProviders();
    }

    @Get('connections')
    async listConnections(@Request() req) {
        return this.integrationsService.listConnections(req.user.companyId);
    }

    @Post('sync')
    async triggerSync(@Body() body: { connectionId: string, type?: 'full' | 'delta' }) {
        return this.integrationsService.triggerSync(body.connectionId, body.type);
    }
}
