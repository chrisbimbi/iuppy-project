import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { NewsEntity } from 'src/news/news.entity'
import { NewsPushServiceV2 } from './news-push.service'
import { NewsPushControllerV2 } from './news-push.controller'
import { CommunicationsService } from 'src/notifications/communications.service'
import { NotificationsModule } from 'src/notifications/notifications.module'
import { AudienceService } from '../audience/audience.service'
import { SchemaIntrospectorV2 } from '../common/schema-introspector.v2'

@Module({
    imports: [TypeOrmModule.forFeature([NewsEntity]), NotificationsModule],
    providers: [NewsPushServiceV2, AudienceService, SchemaIntrospectorV2, CommunicationsService],
    controllers: [NewsPushControllerV2],
})
export class NewsPushModuleV2 { }