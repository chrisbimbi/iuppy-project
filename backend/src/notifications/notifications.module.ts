import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { NotificationsController } from './notifications.controller'
import { CommunicationsService } from './communications.service'
import { FirebaseAdminProvider } from './firebase-admin.provider'

import { UserDeviceEntity } from './entities/user-device.entity'

// ✅ Declare o SchemaIntrospectorV2 aqui para resolver a injeção no CommunicationsService
import { SchemaIntrospectorV2 } from 'src/v2/common/schema-introspector.v2'

@Module({
  imports: [
    TypeOrmModule.forFeature([UserDeviceEntity]),
  ],
  controllers: [NotificationsController],
  providers: [
    ...FirebaseAdminProvider,
    SchemaIntrospectorV2,     // <<— AQUI (resolve o “index [1]”)
    CommunicationsService,
  ],
  exports: [
    CommunicationsService,    // usado em outros módulos (ex.: V2)
  ],
})
export class NotificationsModule {}