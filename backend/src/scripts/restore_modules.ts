
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { CompanyModuleEntity } from '../modules/company-modules/company-module.entity';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    const repo = dataSource.getRepository(CompanyModuleEntity);

    const companyId = '2af4557f-9259-4eed-818d-1d0ffe0b8982';
    const modulesToEnable = [
        'news', 'surveys', 'forms', 'spaces', 'journeys',
        'gamification', 'performance', 'nr1', 'chat'
    ];

    console.log(`Checking modules for company ${companyId}...`);

    for (const key of modulesToEnable) {
        const existing = await repo.findOne({ where: { companyId, key } });
        if (!existing) {
            console.log(`Enabling module: ${key}`);
            await repo.save(repo.create({
                companyId,
                key,
                enabled: true,
                config: {}
            }));
        } else {
            console.log(`Module ${key} already exists.`);
        }
    }

    console.log('Restoration complete.');
    await app.close();
}

bootstrap();
