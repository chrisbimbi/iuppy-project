import { Controller, Get, Post, Put, Delete, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { CreateNewDto } from './dto/create-news.dto';
import { UpdateNewDto } from './dto/update-news.dto';
import { NewsService } from './news.service';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Post()
  async create(@Body() createNewDto: CreateNewDto) {
    try {
      return await this.newsService.create(createNewDto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  async findAll() {
    return await this.newsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const news = await this.newsService.findOne(id);
    if (!news) {
      throw new HttpException('New not found', HttpStatus.NOT_FOUND);
    }
    return news;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateNewDto: UpdateNewDto) {
    return await this.newsService.update(id, updateNewDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.newsService.remove(id);
  }
}
