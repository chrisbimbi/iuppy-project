import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroupEntity } from './group.entity';
import { UserEntity } from '../users/user.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(GroupEntity) private groupRepo: Repository<GroupEntity>,
    @InjectRepository(UserEntity) private userRepo: Repository<UserEntity>,
  ) { }

  // ——— LISTA TODOS OS GRUPOS (Leve para Dropdown) ———
  findAll(companyId: string) {
    return this.groupRepo.find({
      where: { companyId },
      order: { name: 'ASC' },
      // 🔥 OTIMIZAÇÃO: Apenas campos essenciais, sem relations pesadas
      select: ['id', 'name', 'identifier', 'type'],
    });
  }

  // ——— BUSCA 1 GRUPO (Detalhe - Carrega members) ———
  async findOne(id: string): Promise<GroupEntity> {
    const g = await this.groupRepo.findOne({
      where: { id },
      relations: ['members'],
    });
    if (!g) throw new NotFoundException(`Group ${id} not found`);
    return g;
  }

  create(dto: CreateGroupDto): Promise<GroupEntity> {
    const e = this.groupRepo.create(dto);
    return this.groupRepo.save(e);
  }

  async update(id: string, dto: UpdateGroupDto): Promise<GroupEntity> {
    await this.groupRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.groupRepo.delete(id);
  }

  async findMembers(groupId: string): Promise<UserEntity[]> {
    const g = await this.groupRepo.findOne({
      where: { id: groupId },
      relations: ['members'],
    });
    if (!g) throw new NotFoundException(`Group ${groupId} not found`);
    return g.members;
  }

  async addMember(groupId: string, userId: string): Promise<void> {
    const [g, u] = await Promise.all([
      this.groupRepo.findOne({
        where: { id: groupId },
        relations: ['members'],
      }),
      this.userRepo.findOneBy({ id: userId }),
    ]);
    if (!g) throw new NotFoundException(`Group ${groupId} not found`);
    if (!u) throw new NotFoundException(`User ${userId} not found`);
    if (!g.members.some((m) => m.id === userId)) {
      g.members.push(u);
      await this.groupRepo.save(g);
    }
  }

  async removeMember(groupId: string, userId: string): Promise<void> {
    const g = await this.groupRepo.findOne({
      where: { id: groupId },
      relations: ['members'],
    });
    if (!g) throw new NotFoundException(`Group ${groupId} not found`);
    g.members = g.members.filter((m) => m.id !== userId);
    await this.groupRepo.save(g);
  }

  // Used by ChatService to find all groups a user belongs to
  async findUserGroups(userId: string): Promise<GroupEntity[]> {
    return this.groupRepo.createQueryBuilder('group')
      .innerJoin('group.members', 'member')
      .where('member.id = :userId', { userId })
      .getMany();
  }

  async isMember(groupId: string, userId: string): Promise<boolean> {
    const count = await this.groupRepo.createQueryBuilder('group')
      .innerJoin('group.members', 'member')
      .where('group.id = :groupId', { groupId })
      .andWhere('member.id = :userId', { userId })
      .getCount();
    return count > 0;
  }
}
