import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupEntity } from './group.entity';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';

@Module({
  imports: [ TypeOrmModule.forFeature([GroupEntity]) ],
  providers: [ GroupsService ],
  controllers: [ GroupsController ],
  exports: [ GroupsService ],
})
export class GroupsModule {}