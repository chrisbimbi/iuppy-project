
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { JourneyEntity } from '../modules/journeys/entities/journey.entity';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    const journeyRepo = dataSource.getRepository(JourneyEntity);

    console.log('🔧 Fixing Journey Target Audience...');

    const companyId = '2af4557f-9259-4eed-818d-1d0ffe0b8982';

    // Find journeys with restrictive audience
    const journeys = await journeyRepo.createQueryBuilder('j')
        .where('j.companyId = :companyId', { companyId })
        .andWhere('j.targetAudience IS NOT NULL')
        .getMany();

    console.log(`Found ${journeys.length} journeys with target audience set.`);

    for (const j of journeys) {
        console.log(`Updating "${j.title}"...`);
        // Set to null to allow open access (or default rule)
        // Alternatively, we could add the user's space, but clearing it is safer for a "demo" environment
        j.targetAudience = null;
        await journeyRepo.save(j);
        console.log(`✅ Cleared target audience for: ${j.title}`);
    }

    await app.close();
}

bootstrap();
