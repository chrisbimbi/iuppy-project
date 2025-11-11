// src/modules/forms/public-forms.controller.ts
import { BadRequestException, Body, Controller, NotFoundException, Param, Post } from '@nestjs/common';
import { FormsService } from './forms.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';

@Controller('public/forms')
export class PublicFormsController {
  constructor(private readonly formsService: FormsService) {}

  @Post(':formId/submit')
  async submitPublic(
    @Param('formId') formId: string,
    @Body() dto: CreateSubmissionDto,
  ) {
    const form = await this.formsService.findFormById(formId);
    if (!form) {
      throw new NotFoundException('form not found');
    }
    if (!form.allowExternal) {
      throw new BadRequestException('external submissions not allowed for this form');
    }

    // companyId vem do form
    const companyId = form.companyId;
    // userId = null porque é externo
    const res = await this.formsService.submit(companyId, formId, null, {
      ...dto,
      external: true,
    });
    return res;
  }
}
