import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GroupEntity } from './groups/group.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const repo = app.get<Repository<GroupEntity>>(getRepositoryToken(GroupEntity));

    console.log('Enabling chat for all groups...');
    await repo.update({}, { isChatEnabled: true });
    console.log('Done!');

    await app.close();
}
bootstrap();
