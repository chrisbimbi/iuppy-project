import { Body, Controller, Get, Param, Post, Query, Patch, Delete } from '@nestjs/common';
import { PerformanceService } from './performance.service';
import { CreatePerformanceCycleDto } from './dto/create-performance-cycle.dto'; // .ts remove in import
import { CreateGoalDto } from './dto/create-goal.dto';
import { SubmitAssessmentDto } from './dto/submit-assessment.dto';
import { CalibrateUserDto } from './dto/calibrate-user.dto';

@Controller('performance')
export class PerformanceController {
    constructor(private readonly perfService: PerformanceService) { }

    @Post('cycles')
    async createCycle(@Body() dto: CreatePerformanceCycleDto) {
        return this.perfService.createCycle(dto);
    }

    @Post('goals')
    async createGoal(@Body() dto: CreateGoalDto) {
        return this.perfService.createGoal(dto);
    }

    @Patch('goals/:id')
    async updateGoal(@Param('id') id: string, @Body() dto: any) {
        return this.perfService.updateGoal(id, dto);
    }

    @Delete('goals/:id')
    async deleteGoal(@Param('id') id: string) {
        return this.perfService.deleteGoal(id);
    }

    @Post('assessments')
    async submitAssessment(@Body() dto: SubmitAssessmentDto) {
        return this.perfService.submitAssessment(dto);
    }

    @Get('9box')
    async get9Box(@Query('userId') userId: string, @Query('cycleId') cycleId: string) {
        return this.perfService.calculate9Box(userId, cycleId);
    }

    @Get('goals/:userId')
    async getGoals(@Param('userId') userId: string) {
        return this.perfService.getGoals(userId);
    }

    @Get('pdi/:userId')
    async getPDI(@Param('userId') userId: string) {
        return this.perfService.getPDI(userId);
    }

    @Patch('pdi/actions/:id')
    async updatePDIAction(@Param('id') id: string, @Body('status') status: string) {
        return this.perfService.updatePDIAction(id, status);
    }

    @Post('calibration')
    async calibrate(@Body() dto: CalibrateUserDto) {
        return this.perfService.calibrate(dto);
    }
}
