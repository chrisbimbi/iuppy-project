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
import { AudienceResolverService } from './audience-resolver.service';
import { AudienceProbeDto } from './dto/audience-probe.dto';
import { AudienceMode, News } from '@shared/types';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
// opcional extra: import { ModuleEnabled, ModuleEnabledGuard } from 'src/common/guards/module-enabled.guard';

@Controller('news')
export class NewsController {
  constructor(
    private readonly newsService: NewsService,
    private readonly audienceResolverService: AudienceResolverService,
  ) {}

  @Post()
  @UseGuards(JwtAccessGuard /*, ModuleEnabledGuard */)
  // @ModuleEnabled('news')
  async create(@Req() req: any, @Body() dto: CreateNewDto): Promise<News> {
    const user = req.user || {};
    const payload: CreateNewDto = {
      ...dto,
      companyId: user.companyId ?? dto.companyId,
      authorId: user.sub ?? dto.authorId,
    };
    try {
      return await this.newsService.create(payload);
    } catch (error: any) {
      throw new HttpException(error?.message || 'Bad Request', HttpStatus.BAD_REQUEST);
    }
  }

  /** Se for passado ?channelId=xxx, retorna só esse canal; senão, tudo. */
  @Get()
  async findAll(@Query('channelId') channelId?: string): Promise<News[]> {
    return await this.newsService.findAll(channelId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<News> {
    const news = await this.newsService.findOne(id);
    if (!news) {
      throw new HttpException('News not found', HttpStatus.NOT_FOUND);
    }
    return news;
  }

  @Put(':id')
  @UseGuards(JwtAccessGuard /*, ModuleEnabledGuard */)
  // @ModuleEnabled('news')
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateNewDto): Promise<News> {
    const user = req.user || {};
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
  @UseGuards(JwtAccessGuard /*, ModuleEnabledGuard */)
  // @ModuleEnabled('news')
  async remove(@Param('id') id: string): Promise<void> {
    return await this.newsService.remove(id);
  }

  @Post(':id/publish')
  @UseGuards(JwtAccessGuard)
  async publishNews(@Req() req: any, @Param('id') id: string): Promise<News> {
    const user = req.user || {};
    try {
      return await this.newsService.publish(id, user.companyId);
    } catch (error: any) {
      throw new HttpException(error?.message || 'Bad Request', HttpStatus.BAD_REQUEST);
    }
  }

  /** Reenvia push para quem NÃO abriu; aceita overrides de título/conteúdo */
  @Post(':id/resend')
  @UseGuards(JwtAccessGuard)
  async resendNewsToUnopened(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body?: { pushTitle?: string; pushContent?: string },
  ): Promise<{ sent?: number; requested?: number }> {
    const user = req.user || {};
    try {
      return await this.newsService.resendToUnopened(id, user.companyId, body);
    } catch (error: any) {
      throw new HttpException(error?.message || 'Bad Request', HttpStatus.BAD_REQUEST);
    }
  }

  /** Lista de usuários elegíveis que AINDA não abriram (para export/CSV) */
  @Get(':id/unopened-users')
  @UseGuards(JwtAccessGuard)
  async getUnopenedUsers(
    @Req() req: any,
    @Param('id') id: string,
  ): Promise<Array<{ id: string; name?: string | null; email?: string | null }>> {
    const user = req.user || {};
    try {
      return await this.newsService.listUnopenedUsers(id, user.companyId);
    } catch (error: any) {
      throw new HttpException(error?.message || 'Bad Request', HttpStatus.BAD_REQUEST);
    }
  }

  @Post('audience/probe')
  @UseGuards(JwtAccessGuard)
  async probeAudience(
    @Req() req: any,
    @Body() dto: AudienceProbeDto,
  ): Promise<{ totalUsuarios: number; comTokenAtivo: number; mode: AudienceMode; identifiers: Record<string, any> }> {
    const user = req.user || {};
    try {
      return await this.audienceResolverService.probe(
        user.companyId,
        dto.mode,
        { spaceId: dto.spaceId, channelIds: dto.channelIds, groupIds: dto.groupIds },
      );
    } catch (error: any) {
      throw new HttpException(error?.message || 'Bad Request', HttpStatus.BAD_REQUEST);
    }
  }
}