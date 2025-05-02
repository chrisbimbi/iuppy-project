import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroupEntity } from './group.entity';
import { UserEntity } from 'src/users/user.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(GroupEntity) private groupRepo: Repository<GroupEntity>,
    @InjectRepository(UserEntity)  private userRepo: Repository<UserEntity>,
  ) {}

  // CRUD básico
  findAll(companyId: string) {
    return this.groupRepo.find({ where:{ companyId } });
  }
  async findOne(id: string) {
    const g = await this.groupRepo.findOne({ where:{id}, relations:['members'] });
    if(!g) throw new NotFoundException(`Group ${id} not found`);
    return g;
  }
  create(dto: CreateGroupDto) {
    const e = this.groupRepo.create(dto);
    return this.groupRepo.save(e);
  }
  async update(id: string, dto: UpdateGroupDto) {
    await this.groupRepo.update(id, dto);
    return this.findOne(id);
  }
  remove(id: string) {
    return this.groupRepo.delete(id).then(()=>{});
  }

  // ——— membros ———
  async findMembers(groupId: string) {
    const g = await this.groupRepo.findOne({ where:{id:groupId}, relations:['members'] });
    if(!g) throw new NotFoundException(`Group ${groupId} not found`);
    return g.members;
  }
  async addMember(groupId: string, userId: string) {
    const [g,u] = await Promise.all([
      this.groupRepo.findOne({ where:{id:groupId}, relations:['members'] }),
      this.userRepo.findOneBy({ id:userId })
    ]);
    if(!g) throw new NotFoundException(`Group ${groupId} not found`);
    if(!u) throw new NotFoundException(`User ${userId} not found`);
    g.members.push(u);
    await this.groupRepo.save(g);
  }
  async removeMember(groupId: string, userId: string) {
    const g = await this.groupRepo.findOne({ where:{id:groupId}, relations:['members'] });
    if(!g) throw new NotFoundException(`Group ${groupId} not found`);
    g.members = g.members.filter(u=>u.id!==userId);
    await this.groupRepo.save(g);
  }
}