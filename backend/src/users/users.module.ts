import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

import { GroupEntity } from '../groups/group.entity';
import { UserImportService } from './user-import.service';
import { UserImportController } from './user-import.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, GroupEntity])],
  providers: [UsersService, UserImportService],
  controllers: [UsersController, UserImportController],
  exports: [TypeOrmModule, UsersService, UserImportService],
})
export class UsersModule {}
