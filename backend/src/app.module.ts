import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { UsersModule } from './users/users.module';
import { NewsModule } from './news/news.module';
import { ChannelsModule } from './channels/channels.module';
import { SpacesModule } from './spaces/spaces.module';
import { GroupsModule } from './groups/groups.module';
import { SurveysModule } from './modules/surveys/surveys.module';
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

    AuthModule,
    UsersModule,
    NewsModule,
    ChannelsModule,
    SpacesModule,
    GroupsModule,
    SurveysModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }