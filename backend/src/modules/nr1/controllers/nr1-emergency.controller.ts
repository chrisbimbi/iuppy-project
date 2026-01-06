import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    Param,
    UseGuards,
    Req,
    HttpException,
    HttpStatus,
    Query,
} from '@nestjs/common';
import { JwtAccessGuard } from '../../../auth/guards/jwt-access.guard';
import { AuthenticatedRequest } from '../../../common/types/authenticated-request.interface';
import { Nr1EmergencyService } from '../services/nr1-emergency.service';

@Controller('nr1')
export class Nr1EmergencyController {
    constructor(private readonly emergencyService: Nr1EmergencyService) { }

    // --- PROCEDURES ---

    @Get('procedures')
    @UseGuards(JwtAccessGuard)
    async listProcedures(@Req() req: AuthenticatedRequest) {
        return this.emergencyService.listProcedures(req.user.companyId);
    }

    @Post('procedures')
    @UseGuards(JwtAccessGuard)
    async upsertProcedure(
        @Req() req: AuthenticatedRequest,
        @Body() body: any,
    ) {
        return this.emergencyService.upsertProcedure(req.user.companyId, body);
    }

    @Delete('procedures/:id')
    @UseGuards(JwtAccessGuard)
    async deleteProcedure(
        @Req() req: AuthenticatedRequest,
        @Param('id') id: string,
    ) {
        return this.emergencyService.deleteProcedure(req.user.companyId, id);
    }

    // --- DRILLS ---

    @Get('drills')
    @UseGuards(JwtAccessGuard)
    async listDrills(@Req() req: AuthenticatedRequest) {
        return this.emergencyService.listDrills(req.user.companyId);
    }

    @Get('drills/:id')
    @UseGuards(JwtAccessGuard)
    async getDrill(
        @Req() req: AuthenticatedRequest,
        @Param('id') id: string,
    ) {
        return this.emergencyService.getDrill(req.user.companyId, id);
    }

    @Post('drills')
    @UseGuards(JwtAccessGuard)
    async upsertDrill(
        @Req() req: AuthenticatedRequest,
        @Body() body: any,
    ) {
        return this.emergencyService.upsertDrill(req.user.companyId, body);
    }

    @Delete('drills/:id')
    @UseGuards(JwtAccessGuard)
    async deleteDrill(
        @Req() req: AuthenticatedRequest,
        @Param('id') id: string,
    ) {
        return this.emergencyService.deleteDrill(req.user.companyId, id);
    }

    // --- ATTENDANCE ---

    @Post('drills/:id/attendance')
    @UseGuards(JwtAccessGuard)
    async checkIn(
        @Req() req: AuthenticatedRequest,
        @Param('id') id: string,
        @Body() body: { evidence?: string },
    ) {
        try {
            return await this.emergencyService.registerAttendance(
                req.user.companyId,
                id,
                req.user.id,
                body.evidence,
            );
        } catch (error: any) {
            throw new HttpException(
                error?.message || 'Check-in failed',
                HttpStatus.BAD_REQUEST,
            );
        }
    }
}
