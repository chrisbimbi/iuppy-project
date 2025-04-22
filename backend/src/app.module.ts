import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { UsersModule } from './users/users.module';
import { NewsModule } from './news/news.module';
import { ChannelsModule } from './channels/channels.module';
import { SpacesModule } from './spaces/spaces.module';

@Module({
  imports: [
    // carrega .env.development ou .env.production
    ConfigModule.forRoot({
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      isGlobal: true,
    }),

    // conexão com Auto‑Load e sincronização em dev
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
          autoLoadEntities: true,                 // carrega todas as entidades via seus módulos
          synchronize: nodeEnv === 'development', // cria tabela em dev
          logging: nodeEnv === 'development',
        };
      },
      inject: [ConfigService],
    }),

    // seus módulos
    UsersModule,
    NewsModule,
    ChannelsModule,
    SpacesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
