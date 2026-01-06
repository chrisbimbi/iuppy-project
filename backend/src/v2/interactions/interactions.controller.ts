import { Controller, Get } from '@nestjs/common';
import { InteractionsService } from './interactions.service';
import { CommentCounterAdapterV2 } from '../comments/comment-counter.adapter';

/**
 * Controller reservado para interações **não relacionadas a news**.
 * As rotas de news foram movidas para NewsV2Controller em `v2/news/...`.
 */
@Controller('v2/interactions')
export class InteractionsControllerV2 {
  // Mantido no ctor para não quebrar DI em projetos onde esteja usado
  constructor(
    private readonly svc: InteractionsService,
    private readonly _commentsCounter: CommentCounterAdapterV2,
  ) {}

  @Get('health')
  health() {
    return { ok: true, scope: 'interactions', version: 2 };
  }

  // Futuras rotas genéricas de interações entram aqui (fora do domínio de news).
}
