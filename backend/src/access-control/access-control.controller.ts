// backend/src/modules/access-control/access-control.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AccessControlService } from './access-control.service';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
import { Roles } from 'src/common/guards/roles.guard';
import { Role } from '@shared/types';
import { UpsertAccessGrantDto } from '@shared/types/Access';
import { AuthenticatedRequest } from 'src/common/types/authenticated-request.interface';

@Controller('modules/:companyId/access')
@UseGuards(JwtAccessGuard)
export class AccessControlController {
  constructor(private service: AccessControlService) {}

  // ---- Grants (somente admins da empresa) ----
  @Get('grants')
  @Roles(Role.SuperAdmin, Role.CompanyAdmin)
  list(
    @Param('companyId') companyId: string,
    @Query('userId') userId?: string,
  ) {
    return this.service.list(companyId, userId);
  }

  @Post('grants')
  @Roles(Role.SuperAdmin, Role.CompanyAdmin)
  upsert(
    @Param('companyId') companyId: string,
    @Body() dto: UpsertAccessGrantDto,
  ) {
    return this.service.upsert(companyId, dto);
  }

  @Delete('grants/:id')
  @Roles(Role.SuperAdmin, Role.CompanyAdmin)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  // ---- Capabilities (compatível com o front) ----
  // Eu mesmo (logado)
  @Get('capabilities')
  me(@Param('companyId') companyId: string, @Req() req: AuthenticatedRequest) {
    const user = req.user; // populado pelo JwtAccessGuard/Passport
    return this.service.capabilities(companyId, {
      id: String(user.id),
      role: user.role,
    });
  }

  // Admin pode consultar de qualquer user
  @Get('capabilities/:userId')
  @Roles(Role.SuperAdmin, Role.CompanyAdmin)
  capabilitiesAdminView(
    @Param('companyId') companyId: string,
    @Param('userId') userId: string,
  ) {
    return this.service.capabilities(companyId, {
      id: userId,
      role: Role.Viewer,
    });
  }
}
