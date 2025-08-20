import { Body, Controller, Post } from '@nestjs/common'
import { CompaniesService } from './companies.service'
import { Roles } from 'src/common/guards/roles.guard'
import { Role, CompanyProvisioningDto } from '@shared/types'

@Controller('platform/companies')
export class CompaniesController {
    constructor(private service: CompaniesService) { }

    @Post()
    @Roles(Role.SuperAdmin)
    provision(@Body() dto: CompanyProvisioningDto) {
        return this.service.provision(dto)
    }
}