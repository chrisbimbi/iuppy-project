import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { CompanyModulesService } from './company-modules.service';
import { ModuleKey, Role } from '@shared/types';
import { Roles } from 'src/common/guards/roles.guard';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
import { UpsertCompanyModuleDto } from './dto/upsert-company-module.dto';

const ALLOWED_KEYS: ModuleKey[] = [
  'news',
  'channels',
  'groups',
  'surveys',
  'forms',
  'training',
  'jobs',
  'birthdays',
  'recognition',
  'quicklinks',
  'benefits',
  'vacations',
  'podcasts',
  'chat',
  'social',
  'journeys',
  'performance',
  'gamification',
];

@Controller('modules/:companyId/company-modules')
export class CompanyModulesController {
  constructor(private service: CompanyModulesService) { }

  @Get()
  list(@Param('companyId') companyId: string) {
    return this.service.list(companyId);
  }

  @Patch(':key')
  @UseGuards(JwtAccessGuard)
  @Roles(Role.SuperAdmin, Role.CompanyAdmin)
  upsert(
    @Param('companyId') companyId: string,
    @Param('key') key: string,
    @Body() body: UpsertCompanyModuleDto,
  ) {
    if (!ALLOWED_KEYS.includes(key as ModuleKey)) {
      throw new BadRequestException(`Module key inválido: ${key}`);
    }
    return this.service.upsert(
      companyId,
      key as ModuleKey,
      !!body.enabled,
      body.config,
    );
  }
}
