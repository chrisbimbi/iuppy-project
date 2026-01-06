import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    UseGuards,
    Req,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { JwtAccessGuard } from '../../../auth/guards/jwt-access.guard';
import { AuthenticatedRequest } from '../../../common/types/authenticated-request.interface';
import { Nr1TrainingsService } from '../services/nr1-trainings.service';

@Controller('nr1')
export class Nr1TrainingsController {
    constructor(private readonly trainingsService: Nr1TrainingsService) { }

    // --- CATALOG ---

    @Get('trainings')
    @UseGuards(JwtAccessGuard)
    async listTrainings(@Req() req: AuthenticatedRequest) {
        return this.trainingsService.listTrainings(req.user.companyId);
    }

    @Post('trainings')
    @UseGuards(JwtAccessGuard)
    async upsertTraining(
        @Req() req: AuthenticatedRequest,
        @Body() body: any,
    ) {
        return this.trainingsService.upsertTraining(req.user.companyId, body);
    }

    // --- SESSIONS ---

    @Get('sessions')
    @UseGuards(JwtAccessGuard)
    async listSessions(@Req() req: AuthenticatedRequest) {
        return this.trainingsService.listSessions(req.user.companyId);
    }

    @Get('my-sessions')
    @UseGuards(JwtAccessGuard)
    async getMySessions(@Req() req: AuthenticatedRequest) {
        return this.trainingsService.getMySessions(req.user.id);
    }

    @Post('sessions')
    @UseGuards(JwtAccessGuard)
    async createSession(@Req() req: AuthenticatedRequest, @Body() body: any) {
        return this.trainingsService.createSession(req.user.companyId, body);
    }

    // --- INTERACTION ---

    @Post('sessions/:id/progress')
    @UseGuards(JwtAccessGuard)
    async reportProgress(
        @Req() req: AuthenticatedRequest,
        @Param('id') id: string,
        @Body() body: { seconds: number },
    ) {
        if (!body.seconds) throw new HttpException('Missing seconds', HttpStatus.BAD_REQUEST);
        return this.trainingsService.registerProgress(id, req.user.id, body.seconds);
    }

    @Post('sessions/:id/quiz')
    @UseGuards(JwtAccessGuard)
    async submitQuiz(
        @Req() req: AuthenticatedRequest,
        @Param('id') id: string,
        @Body() body: { answers: any },
    ) {
        return this.trainingsService.submitQuiz(id, req.user.id, body.answers);
    }
}
