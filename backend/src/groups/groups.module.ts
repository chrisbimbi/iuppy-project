// backend/src/groups/groups.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupEntity } from './group.entity';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';

import { GroupMembersService } from './group-members.service';
import { GroupMembersController } from './group-members.controller';

// **Importa** o UsersModule para fornecer UserEntityRepository
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GroupEntity]),
    UsersModule,  // <<< aqui
  ],
  providers: [
    GroupsService,
    GroupMembersService,
  ],
  controllers: [
    GroupsController,
    GroupMembersController,
  ],
})
export class GroupsModule {}