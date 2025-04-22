import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SpaceEntity } from './space.entity';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';

@Injectable()
export class SpacesService {
  constructor(
    @InjectRepository(SpaceEntity)
    private spaceRepository: Repository<SpaceEntity>,
  ) {}

  async create(createSpaceDto: CreateSpaceDto): Promise<SpaceEntity> {
    const space = this.spaceRepository.create(createSpaceDto);
    return this.spaceRepository.save(space);
  }

  async findAll(): Promise<SpaceEntity[]> {
    return this.spaceRepository.find();
  }

  async findOne(id: string): Promise<SpaceEntity> {
    const space = await this.spaceRepository.findOne({ where: { id } });
    if (!space) {
      throw new NotFoundException(`Space with id ${id} not found`);
    }
    return space;
  }

  async update(id: string, updateSpaceDto: UpdateSpaceDto): Promise<SpaceEntity> {
    await this.spaceRepository.update(id, updateSpaceDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.spaceRepository.delete(id);
  }
}