import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroupEntity } from './group.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(GroupEntity)
    private readonly repo: Repository<GroupEntity>,
  ) {}

  findAll(companyId: string): Promise<GroupEntity[]> {
    return this.repo.find({ where: { companyId } });
  }

  async findOne(id: string): Promise<GroupEntity> {
    const g = await this.repo.findOneBy({ id });
    if (!g) throw new NotFoundException(`Group ${id} not found`);
    return g;
  }

  create(dto: CreateGroupDto): Promise<GroupEntity> {
    const e = this.repo.create(dto);
    return this.repo.save(e);
  }

  async update(id: string, dto: UpdateGroupDto): Promise<GroupEntity> {
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  remove(id: string): Promise<void> {
    return this.repo.delete(id).then(() => {});
  }
}