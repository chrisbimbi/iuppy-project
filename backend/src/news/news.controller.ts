// backend/src/news/news.controller.ts
import { 
  Controller, Get, Post, Put, Delete,
  Body, Param, HttpException, HttpStatus 
} from '@nestjs/common';
import { CreateNewDto } from './dto/create-news.dto';
import { UpdateNewDto } from './dto/update-news.dto';   // <--- aqui
import { NewsService } from './news.service';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Post()
  async create(@Body() dto: CreateNewDto) {
    try {
      return await this.newsService.create(dto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  async findAll() {
    return this.newsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const n = await this.newsService.findOne(id);
    if (!n) throw new HttpException('New not found', HttpStatus.NOT_FOUND);
    return n;
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateNewDto           // <--- usar o DTO correto
  ) {
    try {
      return await this.newsService.update(id, dto);
    } catch (err) {
      console.error('Erro em NewsController.update:', err);
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.newsService.remove(id);
  }
}