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
import { News } from '@shared/types';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
// opcional extra: import { ModuleEnabled, ModuleEnabledGuard } from 'src/common/guards/module-enabled.guard';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Post()
  @UseGuards(JwtAccessGuard /*, ModuleEnabledGuard */)
  // @ModuleEnabled('news')
  async create(@Req() req: any, @Body() dto: CreateNewDto): Promise<News> {
    const user = req.user || {};
    // força origem do token
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
      throw new HttpException('New not found', HttpStatus.NOT_FOUND);
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
      // mesmo no update, preferimos ignorar authorId/companyId vindos do client
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
}