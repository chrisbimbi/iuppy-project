// backend/src/modules/company-modules/company-modules.module.ts
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CompanyModulesService } from './company-modules.service'
import { CompanyModuleEntity } from './company-module.entity'
import { CompanyModulesController } from './company-modules.controller'

@Module({
  imports: [TypeOrmModule.forFeature([CompanyModuleEntity])],
  providers: [CompanyModulesService],
  controllers: [CompanyModulesController], // ✅ registra as rotas /modules/:companyId/company-modules
  exports: [CompanyModulesService],        // ✅ libera o service para outros módulos/guards
})
export class CompanyModulesModule {}