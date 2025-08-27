import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyModuleEntity } from './company-module.entity';
import { CompanyModulesService } from './company-modules.service';
import { CompanyModulesController } from './company-modules.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CompanyModuleEntity])],
  providers: [CompanyModulesService],
  controllers: [CompanyModulesController],
  exports: [CompanyModulesService],
})
export class CompanyModulesModule {}