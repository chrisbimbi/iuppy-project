import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpException,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreateNewDto } from './dto/create-news.dto';
import { UpdateNewDto } from './dto/update-news.dto';
import { NewsService } from './news.service';
import { NewsAnalyticsService } from './news-analytics.service';
import { HashtagAnalyticsService } from './hashtag-analytics.service';
import { AudienceResolverService } from './audience-resolver.service';
import { AccessControlService } from 'src/access-control/access-control.service';
import { AudienceProbeDto } from './dto/audience-probe.dto';
import { AudienceMode, News, Role } from '@shared/types';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
import { AuthenticatedRequest } from 'src/common/types/authenticated-request.interface';
import { OptionalJwtAuthGuard } from 'src/auth/guards/optional-jwt-access.guard';



@Controller('news')
export class NewsController {
  constructor(
    private readonly newsService: NewsService,
    private readonly audienceResolverService: AudienceResolverService,
    private readonly newsAnalyticsService: NewsAnalyticsService,
    private readonly hashtagAnalyticsService: HashtagAnalyticsService,
    private readonly accessControlService: AccessControlService,
  ) { }

  @Post()
  @UseGuards(JwtAccessGuard)
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateNewDto,
  ): Promise<News> {
    const user = req.user;
    const payload: CreateNewDto = {
      ...dto,
      companyId: user.companyId ?? dto.companyId,
      authorId: user.sub ?? dto.authorId,
    };
    try {
      return await this.newsService.create(payload);
    } catch (error: any) {
      throw new HttpException(
        error?.message || 'Bad Request',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /** Se for passado ?channelId=xxx, retorna só esse canal; senão, tudo. */
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async findAll(
    @Query('channelId') channelId?: string,
    @Req() req?: any,
  ): Promise<News[]> {
    const user = req?.user;
    const companyId = user?.companyId;
    const role = user?.role;
    const userId = user?.id || user?.sub;

    let filterUserId: string | undefined;
    let allowedSpaceIds: string[] | undefined;

    if (role === Role.User) {
      // Regular users: strict segmentation
      filterUserId = userId;
    } else {
      // Admins/Managers: Check ACL capabilities
      const caps = await this.accessControlService.capabilities(companyId, { id: userId, role });
      const newsCaps = caps.modules.news;

      if (!newsCaps?.canView) {
        // If no view access to News module, return empty
        return [];
      }

      if (newsCaps.scopeType === 'SPACE_IDS') {
        allowedSpaceIds = newsCaps.spaceIds;
      }
      // If scopeType is ALL_SPACES, allowedSpaceIds remains undefined (no filter)
    }

    return await this.newsService.findAll(companyId, channelId, filterUserId, allowedSpaceIds);
  }

  @Get('hashtags')
  @UseGuards(JwtAccessGuard)
  async getHashtags(@Req() req: AuthenticatedRequest, @Query('q') q?: string): Promise<string[]> {
    const user = req.user;
    return await this.newsService.getHashtags(user.companyId, q);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async findOne(@Param('id') id: string, @Req() req?: any): Promise<News> {
    const userId = req?.user?.id || req?.user?.sub;
    const news = await this.newsService.findOne(id, userId);
    if (!news) {
      throw new HttpException('News not found', HttpStatus.NOT_FOUND);
    }
    return news;
  }

  @Put(':id')
  @UseGuards(JwtAccessGuard)
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateNewDto,
  ): Promise<News> {
    const user = req.user;
    const toUpdate: UpdateNewDto = {
      ...dto,
      companyId: user.companyId ?? dto.companyId,
      authorId: user.sub ?? dto.authorId,
    };
    try {
      return await this.newsService.update(id, toUpdate);
    } catch (err: any) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Delete(':id')
  @UseGuards(JwtAccessGuard)
  async remove(@Param('id') id: string): Promise<void> {
    return await this.newsService.remove(id);
  }

  @Post(':id/publish')
  @UseGuards(JwtAccessGuard)
  async publishNews(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<News> {
    const user = req.user;
    try {
      return await this.newsService.publish(id, user.companyId);
    } catch (error: any) {
      throw new HttpException(
        error?.message || 'Bad Request',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /** Reenvia push para quem NÃO abriu; aceita overrides de título/conteúdo */
  @Post(':id/resend')
  @UseGuards(JwtAccessGuard)
  async resendNewsToUnopened(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body?: { pushTitle?: string; pushContent?: string },
  ): Promise<{ sent?: number; requested?: number }> {
    const user = req.user;
    try {
      return await this.newsService.resendToUnopened(id, user.companyId, body);
    } catch (error: any) {
      throw new HttpException(
        error?.message || 'Bad Request',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /** Lista de usuários elegíveis que AINDA não abriram (para export/CSV) */
  @Get(':id/unopened-users')
  @UseGuards(JwtAccessGuard)
  async getUnopenedUsers(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<
    Array<{ id: string; name?: string | null; email?: string | null }>
  > {
    const user = req.user;
    try {
      return await this.newsService.listUnopenedUsers(id, user.companyId);
    } catch (error: any) {
      throw new HttpException(
        error?.message || 'Bad Request',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('audience/probe')
  @UseGuards(JwtAccessGuard)
  async probeAudience(
    @Req() req: AuthenticatedRequest,
    @Body() dto: AudienceProbeDto,
  ): Promise<{
    totalUsuarios: number;
    comTokenAtivo: number;
    mode: AudienceMode;
    identifiers: Record<string, any>;
  }> {
    const user = req.user;
    try {
      return await this.audienceResolverService.probe(
        user.companyId,
        dto.mode,
        {
          spaceId: dto.spaceId,
          channelIds: dto.channelIds,
          groupIds: dto.groupIds,
        },
      );
    } catch (error: any) {
      throw new HttpException(
        error?.message || 'Bad Request',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post(':id/acknowledge')
  @UseGuards(JwtAccessGuard)
  async acknowledge(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<void> {
    const user = req.user;
    try {
      await this.newsService.acknowledge(id, user.id, user.companyId);
    } catch (error: any) {
      throw new HttpException(
        error?.message || 'Bad Request',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // ----------
  // 🔥 NOVOS endpoints de listas por usuário (para modais/exports)
  // ----------

  /** /news/:id/users/opened?from&to&limit&offset&q */
  @Get(':id/users/opened')
  @UseGuards(JwtAccessGuard)
  async usersOpened(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('q') q?: string,
  ) {
    const user = req.user;
    try {
      return await this.newsAnalyticsService.listOpenedUsers(
        id,
        user.companyId,
        { from, to },
        {
          limit: limit ? Number(limit) : undefined,
          offset: offset ? Number(offset) : undefined,
          q,
        },
      );
    } catch (error: any) {
      throw new HttpException(
        error?.message || 'Bad Request',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /** /news/:id/users/acknowledged?from&to&limit&offset&q */
  @Get(':id/users/acknowledged')
  @UseGuards(JwtAccessGuard)
  async usersAcknowledged(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('q') q?: string,
  ) {
    const user = req.user;
    try {
      return await this.newsAnalyticsService.listAcknowledgedUsers(
        id,
        user.companyId,
        { from, to },
        {
          limit: limit ? Number(limit) : undefined,
          offset: offset ? Number(offset) : undefined,
          q,
        },
      );
    } catch (error: any) {
      throw new HttpException(
        error?.message || 'Bad Request',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /** /news/:id/users/reacted?from&to&limit&offset&q */
  @Get(':id/users/reacted')
  @UseGuards(JwtAccessGuard)
  async usersReacted(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('q') q?: string,
  ) {
    const user = req.user;
    try {
      return await this.newsAnalyticsService.listReactedUsers(
        id,
        user.companyId,
        { from, to },
        {
          limit: limit ? Number(limit) : undefined,
          offset: offset ? Number(offset) : undefined,
          q,
        },
      );
    } catch (error: any) {
      throw new HttpException(
        error?.message || 'Bad Request',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /** /news/:id/users/commented?from&to&limit&offset&q */
  @Get(':id/users/commented')
  @UseGuards(JwtAccessGuard)
  async usersCommented(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('q') q?: string,
  ) {
    const user = req.user;
    try {
      return await this.newsAnalyticsService.listCommentedUsers(
        id,
        user.companyId,
        { from, to },
        {
          limit: limit ? Number(limit) : undefined,
          offset: offset ? Number(offset) : undefined,
          q,
        },
      );
    } catch (error: any) {
      throw new HttpException(
        error?.message || 'Bad Request',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /** /news/:id/users/shared?from&to&limit&offset&q */
  @Get(':id/users/shared')
  @UseGuards(JwtAccessGuard)
  async usersShared(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('q') q?: string,
  ) {
    const user = req.user;
    try {
      return await this.newsAnalyticsService.listSharedUsers(
        id,
        user.companyId,
        { from, to },
        {
          limit: limit ? Number(limit) : undefined,
          offset: offset ? Number(offset) : undefined,
          q,
        },
      );
    } catch (error: any) {
      throw new HttpException(
        error?.message || 'Bad Request',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('analytics/hashtags/top')
  @UseGuards(JwtAccessGuard)
  async getTopHashtags(@Req() req: AuthenticatedRequest, @Query('limit') limit?: string) {
    const user = req.user;
    return await this.hashtagAnalyticsService.getTopHashtags(user.companyId, limit ? Number(limit) : undefined);
  }

  @Get('analytics/hashtags/:tag')
  @UseGuards(JwtAccessGuard)
  async getHashtagEngagement(@Req() req: AuthenticatedRequest, @Param('tag') tag: string) {
    const user = req.user;
    return await this.hashtagAnalyticsService.getHashtagEngagement(user.companyId, tag);
  }

}
