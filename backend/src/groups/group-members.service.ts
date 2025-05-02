import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../users/user.entity';
import { GroupEntity } from './group.entity';

@Injectable()
export class GroupMembersService {
    constructor(
        @InjectRepository(GroupEntity) private readonly groupRepo: Repository<GroupEntity>,
        @InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>,
    ) { }

    async listMembers(groupId: string): Promise<UserEntity[]> {
        const group = await this.groupRepo.findOne({
            where: { id: groupId },
            relations: ['members'],
        });
        if (!group) throw new NotFoundException(`Group ${groupId} not found`);
        return group.members;
    }

    async addMember(groupId: string, userId: string): Promise<void> {
        const group = await this.groupRepo.findOne({ where: { id: groupId }, relations: ['members'] });
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!group) throw new NotFoundException(`Group ${groupId} not found`);
        if (!user) throw new NotFoundException(`User ${userId} not found`);
        if (!group.members.some(m => m.id === userId)) {
            group.members.push(user);
            await this.groupRepo.save(group);
        }
    }

    async removeMember(groupId: string, userId: string): Promise<void> {
        const group = await this.groupRepo.findOne({ where: { id: groupId }, relations: ['members'] });
        if (!group) throw new NotFoundException(`Group ${groupId} not found`);
        group.members = group.members.filter(m => m.id !== userId);
        await this.groupRepo.save(group);
    }
}