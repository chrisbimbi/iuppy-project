import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AccessGrantsService } from './access-grants.service';
import { CapabilitiesService } from './capabilities.service';
import { UpsertAccessGrantDto } from './dto/upsert-access-grant.dto';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
import { Roles } from 'src/common/guards/roles.guard';
import { Role } from '@shared/types';

@Controller('modules/:companyId/access')
export class AccessGrantsController {
  constructor(
    private service: AccessGrantsService,
    private caps: CapabilitiesService,
  ) {}

  // Admins listam grants
  @Get('grants')
  @UseGuards(JwtAccessGuard)
  @Roles(Role.SuperAdmin, Role.CompanyAdmin)
  list(
    @Param('companyId') companyId: string,
    @Query('userId') userId?: string,
  ) {
    return this.service.list(companyId, userId);
  }

  // Admins upsert
  @Post('grants')
  @UseGuards(JwtAccessGuard)
  @Roles(Role.SuperAdmin, Role.CompanyAdmin)
  upsert(
    @Param('companyId') companyId: string,
    @Body() dto: UpsertAccessGrantDto,
  ) {
    return this.service.upsert(companyId, dto);
  }

  // Admins removem um grant
  @Delete('grants/:id')
  @UseGuards(JwtAccessGuard)
  @Roles(Role.SuperAdmin, Role.CompanyAdmin)
  remove(@Param('companyId') companyId: string, @Param('id') id: string) {
    return this.service.remove(companyId, id);
  }

  // Qualquer usuário autenticado consulta suas capacidades
  @Get('capabilities')
  @UseGuards(JwtAccessGuard)
  me(@Param('companyId') companyId: string, @Req() req: any) {
    const user = req.user; // <- vem do guard
    return this.caps.forUser(companyId, {
      id: String(user.id),
      role: user.role,
    });
  }
}
