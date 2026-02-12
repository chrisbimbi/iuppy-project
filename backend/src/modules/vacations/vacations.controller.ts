import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, Request } from '@nestjs/common';
import { VacationsService } from './vacations.service';
import { CreateVacationRequestDto } from './dto/create-vacation-request.dto'; // .ts extension will be removed in import
import { CreateVacationPolicyDto } from './dto/create-vacation-policy.dto';
// Assuming AuthGuard is available
// import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'; 

@Controller('vacations')
export class VacationsController {
    constructor(private readonly vacationsService: VacationsService) { }

    @Post('policy')
    async createPolicy(@Body() dto: CreateVacationPolicyDto) {
        return this.vacationsService.createPolicy(dto);
    }

    @Patch('policy')
    async updatePolicy(@Query('companyId') companyId: string, @Body() dto: any) {
        if (!companyId) companyId = 'DEFAULT';
        return this.vacationsService.updatePolicy(companyId, dto);
    }

    @Post('requests')
    async requestVacation(@Body() dto: CreateVacationRequestDto) {
        return this.vacationsService.requestVacation(dto.userId, dto);
    }

    @Post('collective')
    async createCollectiveVacation(@Body() dto: any) {
        // dto: { companyId, title, startDate, endDate, targetFilters, description }
        return this.vacationsService.createCollectiveVacation(dto);
    }

    @Get('policy')
    async getPolicy(@Query('companyId') companyId: string = 'DEFAULT') {
        return this.vacationsService.getPolicy(companyId);
    }

    @Get('requests')
    async listRequests(
        @Query('companyId') companyId: string,
        @Query('status') status?: any // Cast to enum in service or here
    ) {
        return this.vacationsService.findAllRequests(companyId, status);
    }

    @Get('requests/user/:userId')
    async getUserRequests(@Param('userId') userId: string) {
        return this.vacationsService.getUserRequests(userId);
    }

    @Patch('requests/:id/approve')
    async approveRequest(@Param('id') id: string, @Body('approverId') approverId: string) {
        return this.vacationsService.approveRequest(id, approverId);
    }

    @Patch('requests/:id/reject')
    async rejectRequest(
        @Param('id') id: string,
        @Body() body: { approverId: string; justification: string }
    ) {
        return this.vacationsService.rejectRequest(id, body.approverId, body.justification);
    }

    @Get('balance/:userId')
    async getBalance(@Param('userId') userId: string) {
        return this.vacationsService.getBalance(userId);
    }
}
