import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { UsersModule } from './users/users.module';
import { NewsModule } from './news/news.module';
import { ChannelsModule } from './channels/channels.module';
import { SpacesModule } from './spaces/spaces.module';
import { GroupsModule } from './groups/groups.module';
import { SurveysModule } from './modules/surveys/surveys.module';
import { FormsModule } from './modules/forms/forms.module';
import { AuthModule } from './auth/auth.module';
import { CompanySettingsModule } from './modules/company-settings/company-settings.module';
import { CompanyModulesModule } from './modules/company-modules/company-modules.module';
import { CompaniesModule } from './modules/platform/companies/companies.module';
import { UploadsModule } from './uploads/uploads.module';
import { AccessControlModule } from './access-control/access-control.module';
import { AccessGrantsModule } from './modules/access-grants/access-grants.module';
import { V2Module } from './v2/common/v2.module';
import { JourneysModule } from './modules/journeys/journeys.module';
import { GamificationModule } from './modules/gamification/gamification.module';

import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { NotificationsModule } from './notifications/notifications.module';
import { MailModule } from './mail/mail.module';

// ⬇️ IMPORTANTE: habilita cron no Nest
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { SearchModule } from './search/search.module';
import { ChatModule } from './chat/chat.module';
import { SocialModule } from './modules/social/social.module';
import { VacationsModule } from './modules/vacations/vacations.module';
import { PerformanceModule } from './modules/performance/performance.module';
import { Nr1Module } from './modules/nr1/nr1.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    // primeiro os módulos de config
    ConfigModule.forRoot({
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      isGlobal: true,
    }),

    // habilita scheduler global
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
      },
    }),

    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),

    NotificationsModule,
    MailModule,

    ThrottlerModule.forRoot([{ ttl: 60, limit: 60 }]),

    UploadsModule,

    // TypeORM primeiro, depois Auth e V2
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (cs: ConfigService) => {
        const nodeEnv = cs.get<string>('NODE_ENV') || 'development';
        return {
          type: 'postgres',
          host: cs.get<string>('DB_HOST'),
          port: parseInt(cs.get<string>('DB_PORT')!, 10),
          username: cs.get<string>('DB_USERNAME'),
          password: cs.get<string>('DB_PASSWORD'),
          database: cs.get<string>('DB_NAME'),
          autoLoadEntities: true,
          synchronize: false,
          logging: nodeEnv === 'development',
        };
      },
      inject: [ConfigService],
    }),

    // auth (tem teus guards jwt-access / jwt-refresh)
    AuthModule,

    // módulos de negócio
    FormsModule,
    V2Module,
    UsersModule,
    NewsModule,
    ChannelsModule,
    SpacesModule,
    GroupsModule,
    SurveysModule,
    CompanySettingsModule,
    CompanyModulesModule,
    CompaniesModule,
    AccessControlModule,
    AccessGrantsModule,
    SearchModule,
    JourneysModule,
    GamificationModule,
    ChatModule,
    SocialModule,
    VacationsModule,
    PerformanceModule,
    Nr1Module,
    IntegrationsModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule { }
