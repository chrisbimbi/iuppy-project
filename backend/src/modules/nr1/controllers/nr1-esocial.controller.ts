import {
    Controller,
    Get,
    Post,
    Body,
    Query,
    UseGuards,
    Req,
} from '@nestjs/common';
import { JwtAccessGuard } from '../../../auth/guards/jwt-access.guard';
import { AuthenticatedRequest } from '../../../common/types/authenticated-request.interface';
import { Nr1EsocialService } from '../services/nr1-esocial.service';
import { EsocialStatus } from '../entities/nr1-esocial-queue.entity';

@Controller('nr1/esocial')
export class Nr1EsocialController {
    constructor(private readonly esocialService: Nr1EsocialService) { }

    @Get('queue')
    @UseGuards(JwtAccessGuard)
    async listQueue(
        @Req() req: AuthenticatedRequest,
        @Query('status') status?: EsocialStatus,
    ) {
        return this.esocialService.listQueue(req.user.companyId, status);
    }

    @Post('generate-s2240')
    @UseGuards(JwtAccessGuard)
    async generateS2240(
        @Req() req: AuthenticatedRequest,
        @Body() body: { employeeId: string },
    ) {
        return this.esocialService.queueS2240(req.user.companyId, body.employeeId);
    }

    @Post('process')
    @UseGuards(JwtAccessGuard)
    async processQueue(@Req() req: AuthenticatedRequest) {
        return this.esocialService.processQueue(req.user.companyId);
    }
}
