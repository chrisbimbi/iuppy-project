import { Body, Controller, Get, Param, Patch } from '@nestjs/common'
import { CompanyModulesService } from './company-modules.service'
import { ModuleKey } from '@shared/types'
import { Roles } from 'src/common/guards/roles.guard'
import { Role } from '@shared/types'

@Controller('modules/:companyId/company-modules')
export class CompanyModulesController {
  constructor(private service: CompanyModulesService) {}

  @Get()
  list(@Param('companyId') companyId: string) {
    return this.service.list(companyId)
  }

  @Patch(':key')
  @Roles(Role.SuperAdmin, Role.CompanyAdmin)
  upsert(
    @Param('companyId') companyId: string,
    @Param('key') key: ModuleKey,
    @Body() body: { enabled: boolean; config?: Record<string, any> }
  ) {
    return this.service.upsert(companyId, key, !!body.enabled, body.config)
  }
}