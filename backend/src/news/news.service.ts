import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NewEntity } from './news.entity';
import { CreateNewDto } from './dto/create-news.dto';
import { UpdateNewDto } from './dto/update-news.dto';
import { instanceToPlain } from 'class-transformer';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(NewEntity)
    private newRepository: Repository<NewEntity>,
  ) { }

  async create(createNewDto: CreateNewDto): Promise<NewEntity> {
    const news = this.newRepository.create(createNewDto);
    return await this.newRepository.save(news);
  }

  async findAll(): Promise<NewEntity[]> {
    return await this.newRepository.find();
  }

  async findOne(id: string): Promise<NewEntity> {
    const news = await this.newRepository.findOneBy({ id });
    if (!news) {
      throw new NotFoundException(`New with id ${id} not found`);
    }
    return news;
  }

  async update(id: string, updateNewDto: UpdateNewDto): Promise<NewEntity> {
    const updateData: QueryDeepPartialEntity<NewEntity> = {
      ...updateNewDto,
      // Converte o campo settings em um objeto plain, caso esteja presente
      settings: updateNewDto.settings ? instanceToPlain(updateNewDto.settings) : undefined,
    };

    await this.newRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.newRepository.delete(id);
  }
}
