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

    @Post(':connectionId/discover-schema')
    async discoverSchema(@Request() req) {
        // In real app, validate user owns connectionId
        return this.integrationsService.discoverSchema(req.params.connectionId);
    }

    @Get(':connectionId/config')
    async getConfig(@Request() req) {
        return this.integrationsService.getConfig(req.params.connectionId);
    }

    @Post(':connectionId/config')
    async saveConfig(@Request() req, @Body() body: { mapping: any, uniqueIdentifier: string }) {
        return this.integrationsService.saveConfig(req.params.connectionId, body.mapping, body.uniqueIdentifier);
    }
}
