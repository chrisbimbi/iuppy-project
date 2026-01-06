import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { NotificationsController } from './notifications.controller';
import { CommunicationsService } from './communications.service';
import { FirebaseAdminProvider } from './firebase-admin.provider';

import { UserDeviceEntity } from './entities/user-device.entity';
import { CommunicationCampaignEntity } from './entities/communication-campaign.entity';
import { CampaignsService } from './campaigns.service';
import { CampaignsController } from './campaigns.controller';

// (opcional) se você precisar do SchemaIntrospectorV2 em outro lugar, deixe.
import { SchemaIntrospectorV2 } from 'src/v2/common/schema-introspector.v2';

@Module({
  imports: [TypeOrmModule.forFeature([UserDeviceEntity, CommunicationCampaignEntity])],
  controllers: [NotificationsController, CampaignsController],
  providers: [
    ...FirebaseAdminProvider,
    SchemaIntrospectorV2,
    CommunicationsService,
    CampaignsService,
  ],
  exports: [CommunicationsService, ...FirebaseAdminProvider, CampaignsService],
})
export class NotificationsModule { }
