import { Module } from '@nestjs/common'
import { CompaniesService } from './companies.service'
import { CompaniesController } from './companies.controller'
import { CompanySettingsModule } from 'src/modules/company-settings/company-settings.module'
import { CompanyModulesModule } from 'src/modules/company-modules/company-modules.module'

@Module({
    imports: [CompanySettingsModule, CompanyModulesModule],
    controllers: [CompaniesController],
    providers: [CompaniesService],
})
export class CompaniesModule { }