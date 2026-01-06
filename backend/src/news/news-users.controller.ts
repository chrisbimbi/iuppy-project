import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
import { UsersByActionQueryDto } from './dto/users-by-action.dto';
import { NewsMetricsService, ActionKind } from './news-metrics.service';

/**
 * Publica as mesmas rotas sob /v2/news e /news
 * para compatibilidade com o fallback do frontend.
 */
@Controller(['v2/news', 'news'])
@UseGuards(JwtAccessGuard)
export class NewsUsersController {
  constructor(private readonly metrics: NewsMetricsService) {}

  @Get(':newsId/users/:kind')
  async listUsersByKind(
    @Req() req: any,
    @Param('newsId') newsId: string,
    @Param('kind') kindParam: string,
    @Query() query: UsersByActionQueryDto,
  ) {
    const user = req.user || {};
    const companyId: string | undefined = user.companyId;
    if (!companyId) throw new BadRequestException('Missing companyId in token');

    // valida e normaliza o "kind"
    const allowed: readonly ActionKind[] = [
      'opened',
      'acknowledged',
      'reacted',
      'commented',
      'shared',
    ] as const;
    const kind = (kindParam || '').toLowerCase() as ActionKind;
    if (!allowed.includes(kind)) {
      throw new BadRequestException(`Invalid kind: ${kindParam}`);
    }

    const { from, to, limit, offset, q } = query;

    const out = await this.metrics.listUsersByAction({
      companyId,
      newsId,
      kind,
      from,
      to,
      limit,
      offset,
      q,
    });

    return {
      items: out.items,
      total: out.total,
      hasMore: out.items.length + (offset ?? 0) < out.total,
    };
  }
}
