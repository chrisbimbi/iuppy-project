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
} from '@nestjs/common';
import { CreateNewDto } from './dto/create-news.dto';
import { UpdateNewDto } from './dto/update-news.dto';
import { NewsService } from './news.service';
import { News } from '@shared/types';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Post()
  async create(@Body() createNewDto: CreateNewDto): Promise<News> {
    try {
      return await this.newsService.create(createNewDto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  /** Se for passado ?channelId=xxx, retorna só esse canal; senão, tudo. */
  @Get()
  async findAll(
    @Query('channelId') channelId?: string
  ): Promise<News[]> {
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
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateNewDto
  ): Promise<News> {
    try {
      return await this.newsService.update(id, updateDto);
    } catch (err) {
      console.error('Erro em NewsController.update:', err);
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return await this.newsService.remove(id);
  }
}