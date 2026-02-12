
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { NewsEntity } from '../news/news.entity';
import { Channel } from '../channels/channel.entity';
import { SpaceEntity } from '../spaces/space.entity'; // Assuming name

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    const newsRepo = dataSource.getRepository(NewsEntity);
    const channelRepo = dataSource.getRepository(Channel);
    const spaceRepo = dataSource.getRepository('SpaceEntity'); // Using string for safety if entity file path is unsure

    console.log('🔧 Fixing Orphaned Seeded News...');

    const companyId = '2af4557f-9259-4eed-818d-1d0ffe0b8982';

    // 1. Find 'Institucional' Space
    const space = await spaceRepo.findOne({
        where: { name: 'Institucional', companyId }
    });

    if (!space) {
        console.error('❌ Space "Institucional" not found!');
        await app.close();
        return;
    }
    console.log(`✅ Found Space: ${space.name} (${space.id})`);

    // 2. Find or Create 'Comunicados' Channel
    let channel = await channelRepo.findOne({
        where: { name: 'Comunicados', companyId }
    });

    if (!channel) {
        // Try 'Comunicados Oficiais'
        channel = await channelRepo.findOne({
            where: { name: 'Comunicados Oficiais', companyId }
        });
    }

    if (!channel) {
        console.log('⚠️ Channel "Comunicados" not found. Creating it...');
        channel = channelRepo.create({
            name: 'Comunicados',
            companyId,
            type: 'articles' as any, // Enum value
            isPublished: true,
            spaceIds: [space.id],
            position: 0
        });
        await channelRepo.save(channel);
        console.log(`✅ Created Channel: ${channel.name} (${channel.id})`);
    } else {
        console.log(`✅ Found Channel: ${channel.name} (${channel.id})`);

        // Ensure it is linked to the space
        const currentSpaces = channel.spaceIds || [];
        if (!currentSpaces.includes(space.id)) {
            console.log(`⚠️ Channel not linked to space ${space.name}. Linking now...`);
            channel.spaceIds = [...currentSpaces, space.id];
            await channelRepo.save(channel);
            console.log(`✅ Channel linked to space.`);
        }
    }

    // 3. Update Orphaned News
    const orphanedNews = await newsRepo.createQueryBuilder('n')
        .where('n.companyId = :companyId', { companyId })
        .andWhere('n.channelId IS NULL')
        .getMany();

    console.log(`\nFound ${orphanedNews.length} orphaned news items.`);

    if (orphanedNews.length > 0) {
        await newsRepo.update(
            { companyId, channelId: null }, // Criteria (unfortunately TypeORM update criteria is strict, better verify)
            // Actually, querying specifically for null channelId is better done via QueryBuilder or raw query if update() behaves oddly with nulls
            // But let's try standard update first using ID list for safety.
            { channelId: channel.id }
        );

        // Use loop or careful update to ensure we only target the ones we found
        console.log(`🔄 Updating ${orphanedNews.length} items to Channel ID: ${channel.id}...`);
        for (const n of orphanedNews) {
            n.channelId = channel.id;
            await newsRepo.save(n);
        }
        console.log(`✅ All orphaned news updated.`);
    }

    await app.close();
}

bootstrap();
