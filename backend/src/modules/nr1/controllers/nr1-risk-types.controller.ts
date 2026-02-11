import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { Nr1RiskTypesService } from '../services/nr1-risk-types.service';
import { JwtAccessGuard } from '../../../auth/guards/jwt-access.guard';

@Controller('nr1/risk-types')
@UseGuards(JwtAccessGuard)
export class Nr1RiskTypesController {
    constructor(private readonly service: Nr1RiskTypesService) { }

    @Get()
    async findAll(@Req() req) {
        return this.service.findAll(req.user.companyId);
    }

    @Post()
    async create(@Req() req, @Body() body: any) {
        return this.service.create(req.user.companyId, body);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() body: any) {
        return this.service.update(id, body);
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.service.delete(id);
    }
}
