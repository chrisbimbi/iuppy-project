// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';                 // ⬅️ add
import { ModuleEnabledGuard } from './common/guards/module-enabled.guard'; // ⬅️ ajuste o caminho se diferente

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { UsersModule } from './users/users.module';
import { NewsModule } from './news/news.module';
import { ChannelsModule } from './channels/channels.module';
import { SpacesModule } from './spaces/spaces.module';
import { GroupsModule } from './groups/groups.module';
import { SurveysModule } from './modules/surveys/surveys.module';
import { CompanySettingsModule } from './modules/company-settings/company-settings.module';
import { CompaniesModule } from './modules/platform/companies/companies.module';
import { CompanyModulesModule } from './modules/company-modules/company-modules.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      isGlobal: true,
    }),

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
          synchronize: nodeEnv === 'development',
          logging: nodeEnv === 'development',
        };
      },
      inject: [ConfigService],
    }),

    // módulos da app
    AuthModule,
    UsersModule,
    NewsModule,
    ChannelsModule,
    SpacesModule,
    GroupsModule,
    SurveysModule,

    // ⚠️ IMPORTANTE: este módulo precisa estar importado aqui
    CompanyModulesModule,

    CompaniesModule,
    CompanySettingsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // ⬅️ torna o guard global (não coloque o guard em "imports"!)
    { provide: APP_GUARD, useClass: ModuleEnabledGuard },
  ],
})
export class AppModule { }