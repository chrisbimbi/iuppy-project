import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessControlService } from './access-control.service';
import { AccessControlController } from './access-control.controller';
import { ModuleAccessGrantEntity } from './module-access-grant.entity';
import { SpaceEntity } from 'src/spaces/space.entity';
import { Channel } from 'src/channels/channel.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ModuleAccessGrantEntity, SpaceEntity, Channel]),
  ],
  controllers: [AccessControlController],
  providers: [AccessControlService],
  exports: [AccessControlService],
})
export class AccessControlModule {}
