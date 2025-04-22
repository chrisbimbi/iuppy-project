// seed.ts
import 'tsconfig-paths/register';
import 'dotenv/config';

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from './src/config/data-source';
import { SpaceEntity } from './src/spaces/space.entity';
import { Channel } from './src/channels/channel.entity';
import { UserEntity } from './src/users/user.entity';
import { NewEntity } from './src/news/news.entity';
import { Role } from '../shared/src/types/Role';

//
// Atenção: dentro do container, 'localhost:4000' NÃO funciona.
// Usamos o hostname do serviço Docker Compose: 'api:3000'.
//

const API = process.env.API_URL || 'http://api:3000';

interface SpaceDto {
    name: string;
    slug?: string;
    description?: string;
    imageUrl?: string;
    priority?: number;
    active?: boolean;
    companyId: string;
}

interface ChannelDto {
    name: string;
    description?: string;
    companyId: string;
    spaceIds?: string[];
    groupIds?: string[];
}

interface CreateUserDto {
    email: string;
    name: string;
    displayName: string;
    password: string;
    role: Role;
    companyId: string;
    spaceId?: string;
    groups?: string[];
    visibleGroups?: string[];
}

interface CreateNewsDto {
    title: string;
    subtitle?: string;
    content: string;
    channelId: string;
    authorId: string;
    companyId: string;
    type: 'ANNOUNCEMENT' | 'UPDATE' | 'ALERT';
    isPublished: boolean;
    attachments: any[];
    highlightImages: any[];
    settings: {
        visibility: 'public' | 'private' | 'specific_groups';
        allowComments: boolean;
        moderateComments: boolean;
        allowReactions: boolean;
        notifyUsers: boolean;
        pushNotification: boolean;
        emailNotification: boolean;
        allowSharing: boolean;
        showAuthor: boolean;
        showPublishDate: boolean;
        pinToTop: boolean;
        schedulePublication: boolean;
        expirePublication: boolean;
        pushTitle: string;
        pushContent: string;
        targetAudience: string[];
        expirationDate?: string;
        schedulePublishDate?: string;
    };
}

async function seed() {
    try {
        // 1) Inicializa o TypeORM
        await AppDataSource.initialize();
        console.log('🗄️ DataSource initialized');

        const newsRepo = AppDataSource.getRepository(NewEntity);
        const userRepo = AppDataSource.getRepository(UserEntity);
        const channelRepo = AppDataSource.getRepository(Channel);
        const spaceRepo = AppDataSource.getRepository(SpaceEntity);

        // 2) Limpa tabelas na ordem correta
        await newsRepo.clear(); console.log('Cleared news');
        await userRepo.clear(); console.log('Cleared users');
        await channelRepo.clear(); console.log('Cleared channels');
        await spaceRepo.clear(); console.log('Cleared spaces');

        // 3) Gera 2 companyIds
        const companies = [uuidv4(), uuidv4()];
        console.log('Company IDs:', companies);

        // 4) Cria 2 spaces por empresa
        const spacesToCreate: SpaceDto[] = companies.flatMap(cid => [
            { name: 'HQ', slug: 'hq', description: 'Headquarters', priority: 1, active: true, companyId: cid },
            { name: 'Branch', slug: 'branch', description: 'Branch office', priority: 2, active: true, companyId: cid },
        ]);
        const spacesResponses = await Promise.all(
            spacesToCreate.map(s => axios.post(`${API}/spaces`, s))
        );
        const spaces = spacesResponses.map(r => r.data as SpaceEntity);
        console.log('Created Spaces:', spaces.map(s => s.id));
        const spacesByCompany = companies.map((cid, i) => [
            spaces[i * 2].id,     // HQ
            spaces[i * 2 + 1].id  // Branch
        ]);
        // 5) Cria 2 channels por empresa
        const channelsToCreate: ChannelDto[] = companies.flatMap((cid, i) => [
            {
                name: 'General',
                description: 'General news',
                companyId: cid,
                spaceIds: spacesByCompany[i],      // <<< aqui
            },
            {
                name: 'Team',
                description: 'Team‑specific news',
                companyId: cid,
                spaceIds: spacesByCompany[i],      // <<< e aqui
            },
        ]);
        const channelsResponses = await Promise.all(
            channelsToCreate.map(c => axios.post(`${API}/channels`, c))
        );
        const channels = channelsResponses.map(r => r.data as Channel);
        console.log('Created Channels:', channels.map(c => c.id));

        // 6) Cria 2 usuários por empresa
        const usersToCreate: CreateUserDto[] = companies.flatMap((cid, i) => [
            {
                email: `admin${i}@example.com`,
                name: `Admin ${i}`,
                displayName: `Admin ${i}`,
                password: 'P@ssw0rd!',
                role: Role.ADMIN,
                companyId: cid,
                spaceId: spaces[i * 2].id,
            },
            {
                email: `user${i}@example.com`,
                name: `User ${i}`,
                displayName: `User ${i}`,
                password: 'P@ssw0rd!',
                role: Role.USER,
                companyId: cid,
                spaceId: spaces[i * 2 + 1].id,
            },
        ]);
        const usersResponses = await Promise.all(
            usersToCreate.map(u => axios.post(`${API}/users`, u))
        );
        const users = usersResponses.map(r => r.data as UserEntity);
        console.log('Created Users:', users.map(u => u.id));

        // 7) Cria 2 notícias por empresa em cada canal
        const newsToCreate: CreateNewsDto[] = companies.flatMap((cid, i) => [
            {
                title: `Announcement for ${cid}-1`,
                subtitle: 'Seed data',
                content: 'This is a test announcement.',
                channelId: channels[i * 2].id,
                authorId: users[i * 2].id,
                companyId: cid,
                type: 'ANNOUNCEMENT',
                isPublished: true,
                attachments: [],
                highlightImages: [],
                settings: {
                    visibility: 'public',
                    allowComments: true,
                    moderateComments: false,
                    allowReactions: true,
                    notifyUsers: false,
                    pushNotification: false,
                    emailNotification: false,
                    allowSharing: true,
                    showAuthor: true,
                    showPublishDate: true,
                    pinToTop: false,
                    schedulePublication: false,
                    expirePublication: false,
                    pushTitle: '',
                    pushContent: '',
                    targetAudience: [spaces[i * 2].id],
                },
            },
            {
                title: `Update for ${cid}-2`,
                subtitle: 'Seed data',
                content: 'This is a test update.',
                channelId: channels[i * 2 + 1].id,
                authorId: users[i * 2 + 1].id,
                companyId: cid,
                type: 'UPDATE',
                isPublished: false,
                attachments: [],
                highlightImages: [],
                settings: {
                    visibility: 'specific_groups',
                    allowComments: true,
                    moderateComments: true,
                    allowReactions: false,
                    notifyUsers: false,
                    pushNotification: false,
                    emailNotification: false,
                    allowSharing: false,
                    showAuthor: true,
                    showPublishDate: true,
                    pinToTop: false,
                    schedulePublication: false,
                    expirePublication: false,
                    pushTitle: '',
                    pushContent: '',
                    targetAudience: [spaces[i * 2 + 1].id],
                },
            },
        ]);
        const newsResponses = await Promise.all(
            newsToCreate.map(n => axios.post(`${API}/news`, n))
        );
        const news = newsResponses.map(r => r.data as NewEntity);
        console.log('Created News:', news.map(n => n.id));

        console.log('✅ Seeding completed successfully');
        await AppDataSource.destroy();
    } catch (err: any) {
        console.error('❌ Seeding error:', err.response?.data || err.message);
        process.exit(1);
    }
}

seed();
