import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SpaceEntity } from './space.entity';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';

@Injectable()
export class SpacesService {
  constructor(@InjectRepository(SpaceEntity) private repo: Repository<SpaceEntity>) {}

  findByCompany(companyId: string): Promise<SpaceEntity[]> {
    return this.repo.find({ where: { companyId }, order: { priority: 'ASC' } });
  }

  async findOne(id: string): Promise<SpaceEntity> {
    const s = await this.repo.findOneBy({ id });
    if (!s) throw new NotFoundException(`Space ${id} not found`);
    return s;
  }

  create(dto: CreateSpaceDto): Promise<SpaceEntity> {
    const e = this.repo.create(dto);
    return this.repo.save(e);
  }

  async update(id: string, dto: UpdateSpaceDto): Promise<SpaceEntity> {
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}