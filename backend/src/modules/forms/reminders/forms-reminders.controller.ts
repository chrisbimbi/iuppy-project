// src/modules/forms/forms-reminders.controller.ts
import {
  Controller,
  Post,
  Query,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
import { FormsRemindersService } from './forms-reminders.service';

@Controller('forms/reminders')
@UseGuards(JwtAccessGuard)
export class FormsRemindersController {
  constructor(private readonly reminders: FormsRemindersService) {}

  private getCompanyIdSync(req: any): string | null {
    return (
      req?.user?.companyId ||
      req?.user?.company?.id ||
      req?.headers?.['x-company-id'] ||
      req?.query?.companyId ||
      null
    );
  }

  @Post('run')
  async run(@Req() req: any, @Query('companyId') companyIdQ?: string) {
    const companyId = companyIdQ || this.getCompanyIdSync(req);
    if (!companyId) throw new BadRequestException('companyId missing');
    return this.reminders.runForCompany(companyId);
  }
}
