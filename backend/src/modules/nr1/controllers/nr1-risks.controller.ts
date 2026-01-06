import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, Req } from '@nestjs/common';
import { Nr1RisksService } from '../services/nr1-risks.service';
import { Nr1RiskRecord } from '../entities/nr1-risk-record.entity';
import { JwtAccessGuard } from '../../../auth/guards/jwt-access.guard';
import { AuthenticatedRequest } from '../../../common/types/authenticated-request.interface';

@Controller('nr1/risks')
export class Nr1RisksController {
    constructor(private readonly risksService: Nr1RisksService) { }

    @Post()
    @UseGuards(JwtAccessGuard)
    async create(@Body() data: Partial<Nr1RiskRecord>, @Req() req: AuthenticatedRequest) {
        data.company_id = req.user.companyId;
        return this.risksService.create(data);
    }

    @Get()
    async findAll(@Query('companyId') companyId: string, @Query() filters: any) {
        if (!companyId) {
            // Fallback or error if companyId is mandatory for tenant isolation
            // Assuming middleware or global pipe might handle this, or we throw
            // For now, let's assume it's passed
        }
        return this.risksService.findAll(companyId, filters);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.risksService.findOne(id);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() updates: Partial<Nr1RiskRecord>) {
        return this.risksService.update(id, updates);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.risksService.delete(id);
    }

    @Post('publish')
    @UseGuards(JwtAccessGuard)
    async publishVersion(@Body() body: { spaceId?: string }, @Req() req: AuthenticatedRequest) {
        return this.risksService.publishVersion(req.user.companyId, body.spaceId);
    }
}
