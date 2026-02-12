
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { NewsEntity } from '../news/news.entity';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    const newsRepo = dataSource.getRepository(NewsEntity);

    console.log('🔧 Fixing Missing Subtitles...');

    const companyId = '2af4557f-9259-4eed-818d-1d0ffe0b8982';

    // Find news without subtitle
    const newsWithoutSubtitle = await newsRepo
        .createQueryBuilder('n')
        .where('n.companyId = :companyId', { companyId })
        .andWhere('(n.subtitle IS NULL OR n.subtitle = \'\')')
        .getMany();

    console.log(`Found ${newsWithoutSubtitle.length} news without subtitle.`);

    for (const news of newsWithoutSubtitle) {
        // Generate subtitle from title or content
        const subtitle = news.title.length > 80
            ? news.title.substring(0, 77) + '...'
            : news.title;

        news.subtitle = subtitle;
        await newsRepo.save(news);
        console.log(`✅ Added subtitle to: ${news.title}`);
    }

    console.log('\n✅ All news now have subtitles!');
    await app.close();
}

bootstrap();
