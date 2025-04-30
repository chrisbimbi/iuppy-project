// backend/src/news/news.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NewEntity } from './news.entity';
import { CreateNewDto } from './dto/create-news.dto';
import { UpdateNewDto } from './dto/update-news.dto';
import { News } from '@shared/types';

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(NewEntity)
    private readonly repo: Repository<NewEntity>,
  ) {}

  async create(dto: CreateNewDto): Promise<News> {
    const entity = this.repo.create({
      ...dto,
      attachments: dto.attachments?.map(a => a.url) ?? [],
      highlightImages: dto.highlightImages?.map(i => i.url) ?? [],
    });
    return this.repo.save(entity);
  }

  async findAll(): Promise<News[]> {
    return this.repo.find();
  }

  async findOne(id: string): Promise<News | null> {
    return this.repo.findOneBy({ id });
  }

  async update(id: string, dto: UpdateNewDto): Promise<News> {
    const toUpdate: any = { ...dto };
    if (dto.attachments) {
      toUpdate.attachments = dto.attachments.map(a => a.url);
    }
    if (dto.highlightImages) {
      toUpdate.highlightImages = dto.highlightImages.map(i => i.url);
    }
    await this.repo.update(id, toUpdate);
    return this.findOne(id) as Promise<News>;
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}