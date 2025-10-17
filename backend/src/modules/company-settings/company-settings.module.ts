import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanySettingsEntity } from './company-settings.entity';
import { CompanySettingsService } from './company-settings.service';
import { CompanySettingsController } from './company-settings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CompanySettingsEntity])],
  providers: [CompanySettingsService],
  controllers: [CompanySettingsController],
  exports: [CompanySettingsService],
})
export class CompanySettingsModule {}