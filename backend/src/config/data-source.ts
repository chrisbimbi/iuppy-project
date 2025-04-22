import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { UserEntity } from '../users/user.entity';
import { Channel } from '../channels/channel.entity';
import { SpaceEntity } from '../spaces/space.entity';
import { NewEntity } from '../news/news.entity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT!, 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [UserEntity, Channel, SpaceEntity, NewEntity],
  migrations: ['src/migrations/*.ts'],
  migrationsTableName: 'migrations',
  synchronize: false,
});
