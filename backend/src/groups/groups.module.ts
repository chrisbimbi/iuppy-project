import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupEntity } from './group.entity';
import { UserEntity } from '../users/user.entity';

import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { GroupMembersService } from './group-members.service';
import { GroupMembersController } from './group-members.controller';

@Module({
  imports: [
    // registra os dois repositórios para injeção
    TypeOrmModule.forFeature([GroupEntity, UserEntity]),
  ],
  providers: [GroupsService, GroupMembersService],
  controllers: [GroupsController, GroupMembersController],
})
export class GroupsModule {}