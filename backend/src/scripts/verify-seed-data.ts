import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { VacationRequestEntity } from '../modules/vacations/entities/vacation-request.entity';
import { AssessmentFormEntity } from '../modules/performance/entities/assessment-form.entity';
import { PDIEntity } from '../modules/performance/entities/pdi.entity';
import { OneOnOneEntity } from '../modules/performance/entities/one-on-one.entity';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);

    const requestRepo = dataSource.getRepository(VacationRequestEntity);
    const formRepo = dataSource.getRepository(AssessmentFormEntity);
    const pdiRepo = dataSource.getRepository(PDIEntity);
    const oneOnOneRepo = dataSource.getRepository(OneOnOneEntity);

    console.log('🔍 Verifying Seed Data...');

    const requests = await requestRepo.count();
    console.log(`Vacation Requests: ${requests}`);

    const forms = await formRepo.count();
    console.log(`Assessment Forms: ${forms}`);

    const pdis = await pdiRepo.count();
    console.log(`PDIs: ${pdis}`);

    const oneOnOnes = await oneOnOneRepo.count();
    console.log(`One-on-Ones: ${oneOnOnes}`);

    await app.close();
}

bootstrap();
