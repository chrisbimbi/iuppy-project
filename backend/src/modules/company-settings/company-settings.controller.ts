import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common'
import { CompanySettingsService } from './company-settings.service'
import { Roles } from 'src/common/guards/roles.guard'
import { Role } from '@shared/types'
import { UpsertCompanySettingsDto } from './dto/upsert-company-settings.dto'

@Controller('modules/:companyId/company-settings')
export class CompanySettingsController {
    constructor(private service: CompanySettingsService) { }

    @Get()
    get(@Param('companyId') companyId: string) {
        return this.service.get(companyId)
    }

    @Patch()
    @UseGuards() @Roles(Role.SuperAdmin, Role.CompanyAdmin)
    upsert(@Param('companyId') companyId: string, @Body() dto: UpsertCompanySettingsDto) {
        return this.service.upsert(companyId, dto)
    }
}