import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Nr1ActionPlansService } from '../services/nr1-action-plans.service';
import { Nr1ActionPlan } from '../entities/nr1-action-plan.entity';

@Controller('nr1/actions')
export class Nr1ActionPlansController {
    constructor(private readonly actionsService: Nr1ActionPlansService) { }

    @Post()
    async create(@Body() data: Partial<Nr1ActionPlan>) {
        return this.actionsService.create(data);
    }

    @Get()
    async findAll(@Query('companyId') companyId: string, @Query() filters: any) {
        return this.actionsService.findAllByCompany(companyId, filters);
    }

    @Get('by-risk/:riskId')
    async findAllByRisk(@Param('riskId') riskId: string) {
        return this.actionsService.findAllByRisk(riskId);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() updates: Partial<Nr1ActionPlan>) {
        return this.actionsService.update(id, updates);
    }
}
