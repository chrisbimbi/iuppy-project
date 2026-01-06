import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AudienceSelectionDto } from './dto/audience-selection.dto';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
import { AudienceService } from 'src/v2/audience/audience.service';
// Se você usa guard/jwt no v2:

@Controller('v2/news')
@UseGuards(JwtAccessGuard)
export class NewsAudienceController {
  constructor(private readonly audience: AudienceService) {}

  @Post(':id/audience/apply')
  async apply(
    @Param('id') id: string,
    @Body() body: AudienceSelectionDto,
    @Req() req: any,
  ) {
    const companyId: string = req.user.companyId;
    await this.audience.applySelectionToNews(companyId, id, body);
    return { ok: true };
  }
}
