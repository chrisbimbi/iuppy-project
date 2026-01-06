import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Nr1ParticipationService } from '../services/nr1-participation.service';

@Controller('nr1/participation')
export class Nr1ParticipationController {
    constructor(private readonly service: Nr1ParticipationService) { }

    @Get('submissions')
    async listSubmissions(
        @Query('companyId') companyId: string,
        @Query('template') template: string // e.g. 'nr1_near_miss'
    ) {
        return this.service.listNr1Submissions(companyId, template);
    }

    @Post('convert/risk')
    async convertToRisk(
        @Body() body: { companyId: string; submissionId: string; riskData: any }
    ) {
        return this.service.convertToRisk(body.companyId, body.submissionId, body.riskData);
    }

    @Post('convert/action')
    async convertToAction(
        @Body() body: { companyId: string; submissionId: string; riskId: string; actionData: any }
    ) {
        return this.service.convertToAction(body.companyId, body.submissionId, body.riskId, body.actionData);
    }
}
