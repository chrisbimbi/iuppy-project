// src/v2/audience/audience.service.ts
import { Injectable } from '@nestjs/common';
import { AudienceResolverService } from 'src/news/audience-resolver.service';
import { AudienceSelectionDto } from 'src/news/dto/audience-selection.dto';
import { AudienceMode } from '@shared/types/NewsSettings';

@Injectable()
export class AudienceService {
  constructor(private readonly resolver: AudienceResolverService) {}

  async probe(
    companyId: string,
    mode: AudienceMode,
    params: Record<string, any>,
  ) {
    return this.resolver.probe(companyId, mode, params);
  }

  async applySelectionToNews(
    companyId: string,
    newsId: string,
    selection: AudienceSelectionDto,
  ) {
    return this.resolver.applySelectionToNews(companyId, newsId, selection);
  }
}
