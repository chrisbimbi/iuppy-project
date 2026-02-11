import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SpaceEntity } from './space.entity';
import { UserSpaceEntity } from './user-space.entity';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';

@Injectable()
export class SpacesService {
  constructor(
    @InjectRepository(SpaceEntity) private repo: Repository<SpaceEntity>,
    @InjectRepository(UserSpaceEntity)
    private userSpaceRepo: Repository<UserSpaceEntity>,
  ) { }

  async findByCompany(companyId: string): Promise<SpaceEntity[]> {
    try {
      return await this.repo.find({
        where: { companyId },
        relations: ['userSpaces'],
        order: { priority: 'ASC' },
      });
    } catch (e: any) {
      console.error('SpacesService.findByCompany ERROR:', e);
      throw new InternalServerErrorException(`Failed to list spaces: ${e.message}`);
    }
  }

  async findOne(id: string): Promise<SpaceEntity> {
    const s = await this.repo.createQueryBuilder('space')
      .leftJoinAndSelect('space.userSpaces', 'user_space_entity')
      .where('space.id = :id', { id })
      .getOne();

    if (!s) throw new NotFoundException(`Space ${id} not found`);
    return s;
  }

  async create(dto: CreateSpaceDto): Promise<SpaceEntity> {
    const { memberIds, ...rest } = dto;
    const e = this.repo.create(rest);
    const saved = await this.repo.save(e);

    if (memberIds && memberIds.length > 0) {
      await this.syncMembers(saved.id, saved.companyId, memberIds);
    }
    return this.findOne(saved.id);
  }

  async update(id: string, dto: UpdateSpaceDto): Promise<SpaceEntity> {
    const { memberIds, ...rest } = dto;
    await this.repo.update(id, rest);
    const space = await this.findOne(id);

    if (memberIds !== undefined) {
      await this.syncMembers(id, space.companyId, memberIds);
    }
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  private async syncMembers(
    spaceId: string,
    companyId: string,
    userIds: string[],
  ) {
    // Current members
    const current = await this.userSpaceRepo.find({ where: { spaceId } });
    const currentIds = new Set(current.map((c) => c.userId));
    const targetIds = new Set(userIds);

    // Remove
    const toRemove = current.filter((c) => !targetIds.has(c.userId));
    if (toRemove.length) {
      await this.userSpaceRepo.remove(toRemove);
    }

    // Add
    const toAdd = userIds.filter((uid) => !currentIds.has(uid));
    if (toAdd.length) {
      const rows = toAdd.map((userId) =>
        this.userSpaceRepo.create({
          spaceId,
          userId,
          companyId,
        }),
      );
      await this.userSpaceRepo.save(rows);
    }
  }
}
