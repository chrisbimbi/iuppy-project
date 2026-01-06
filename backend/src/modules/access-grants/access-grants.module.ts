import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessGrantEntity } from './access-grant.entity';
import { AccessGrantsService } from './access-grants.service';
import { AccessGrantsController } from './access-grants.controller';
import { CapabilitiesService } from './capabilities.service';

@Module({
  imports: [TypeOrmModule.forFeature([AccessGrantEntity])],
  providers: [AccessGrantsService, CapabilitiesService],
  controllers: [AccessGrantsController],
  exports: [AccessGrantsService, CapabilitiesService],
})
export class AccessGrantsModule {}
