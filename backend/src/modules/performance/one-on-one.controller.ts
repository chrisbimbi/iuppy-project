import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PerformanceService } from './performance.service';

@Controller('performance/1on1')
export class OneOnOneController {
    constructor(private readonly perfService: PerformanceService) { }

    @Post()
    async create(@Body() dto: any) {
        return this.perfService.createOneOnOne(dto);
    }

    @Get()
    async list(@Query('userId') userId: string, @Query('targetId') targetId: string) {
        return this.perfService.listOneOnOnes(userId, targetId);
    }

    @Patch(':id/points')
    async updatePoints(@Param('id') id: string, @Body() body: { talkingPoints: any[] }) {
        return this.perfService.updateOneOnOnePoints(id, body.talkingPoints);
    }

    @Patch(':id/complete')
    async complete(@Param('id') id: string) {
        return this.perfService.completeOneOnOne(id);
    }
}
