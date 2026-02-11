// seed.ts
import 'tsconfig-paths/register';
import 'dotenv/config';

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from './src/config/data-source';
import { SpaceEntity } from './src/spaces/space.entity';
import { Channel } from './src/channels/channel.entity';
import { UserEntity } from './src/users/user.entity';
import { NewsEntity } from './src/news/news.entity';
import { CompanyEntity } from './src/companies/company.entity';
import { Role } from '../shared/src/types/Role';
import { GroupEntity } from './src/groups/group.entity';
import * as argon2 from 'argon2';
import { CompanyModuleEntity } from './src/modules/company-modules/company-module.entity';

const API = process.env.API_URL || 'http://api:3000';

async function seed() {
    try {
        // 1) Inicializa o TypeORM
        await AppDataSource.initialize();
        console.log('🗄️ DataSource initialized');

        // 2) Limpa tabelas (TRUNCATE CASCADE para limpar tudo respeitando FKs)
        const entities = [
            'news_metrics_daily',
            'user_metrics_daily',
            'news_interaction_event',
            'news_reaction',
            'news_comment',
            'news_share',
            'push_delivery',
            'user_device',
            'news_entity',
            'channel',
            'user_group_members',
            'user_entity',
            'user_group',
            'space',
            'companies',
            'survey_response',
            'survey_question',
            'survey'
        ];

        console.log('🧹 Cleaning tables...');
        for (const table of entities) {
            try {
                await AppDataSource.query(`TRUNCATE TABLE "${table}" CASCADE;`);
            } catch (e) {
                console.log(`⚠️ Could not truncate ${table}, trying delete...`);
                await AppDataSource.query(`DELETE FROM "${table}";`);
            }
        }
        console.log('✨ Tables cleaned.');

        // 3) Cria Empresa
        const companyRepo = AppDataSource.getRepository(CompanyEntity);
        const company = companyRepo.create({
            id: uuidv4(),
            name: 'Iuppy Tech',
            description: 'Empresa de Tecnologia',
        });
        await companyRepo.save(company);
        const cid = company.id;
        console.log(`🏢 Company created: ${company.name} (${cid})`);

        // 3.1) Ativa Módulos
        const companyModuleRepo = AppDataSource.getRepository(CompanyModuleEntity); // Importar CompanyModuleEntity no topo!
        const modules = ['news', 'surveys', 'forms', 'spaces', 'journeys', 'performance', 'gamification'];
        const moduleEntities = modules.map(key => companyModuleRepo.create({
            companyId: cid,
            key,
            enabled: true,
            config: {}
        }));
        await companyModuleRepo.save(moduleEntities);
        console.log('📦 Modules enabled:', modules.join(', '));

        // 4) Cria Grupos Básicos
        const groupRepo = AppDataSource.getRepository(GroupEntity);
        const groupAll = groupRepo.create({
            name: 'Todos',
            description: 'Todos os colaboradores',
            companyId: cid,
            isAutoCreated: true,
        });
        const groupDev = groupRepo.create({
            name: 'Developers',
            description: 'Time de Desenvolvimento',
            companyId: cid,
            isAutoCreated: false,
        });
        await groupRepo.save([groupAll, groupDev]);
        console.log('👥 Groups created');

        // 5) Cria Spaces
        const spaceRepo = AppDataSource.getRepository(SpaceEntity);
        const spaceGeral = spaceRepo.create({
            name: 'Geral',
            slug: 'geral',
            description: 'Espaço para comunicados gerais',
            priority: 1,
            active: true,
            companyId: cid,
            targetGroupIds: [groupAll.id], // Visível para todos
        });
        const spaceDev = spaceRepo.create({
            name: 'Desenvolvimento',
            slug: 'dev',
            description: 'Espaço para time de tecnologia',
            priority: 2,
            active: true,
            companyId: cid,
            targetGroupIds: [groupDev.id], // Visível apenas para devs
        });
        await spaceRepo.save([spaceGeral, spaceDev]);
        console.log('🪐 Spaces created');

        // 6) Cria Channels
        const channelRepo = AppDataSource.getRepository(Channel);
        const channelComunicados = channelRepo.create({
            name: 'Comunicados Oficiais',
            description: 'Notícias oficiais da empresa',
            companyId: cid,
            spaceIds: [spaceGeral.id],
            isPublished: true,
        });
        const channelTech = channelRepo.create({
            name: 'Tech News',
            description: 'Novidades de tecnologia',
            companyId: cid,
            spaceIds: [spaceDev.id], // Canal exclusivo do espaço Dev
            isPublished: true,
        });
        await channelRepo.save([channelComunicados, channelTech]);
        console.log('📺 Channels created');

        // 7) Cria Usuários
        const userRepo = AppDataSource.getRepository(UserEntity);

        // Admin
        const admin = userRepo.create({
            email: 'admin@iuppy.com.br',
            name: 'Admin Iuppy',
            displayName: 'Admin',
            password: await argon2.hash('123'),
            role: Role.CompanyAdmin,
            companyId: cid,
            groups: [groupAll.id, groupDev.id],
            memberOf: [groupAll, groupDev],
            isActive: true,
        });

        // Dev User (para teste de login CPF/Phone)
        const devUser = userRepo.create({
            email: 'dev@iuppy.com.br',
            name: 'Developer Test',
            displayName: 'Dev',
            password: await argon2.hash('123'),
            role: Role.User,
            companyId: cid,
            groups: [groupAll.id, groupDev.id], // Pertence aos dois grupos
            memberOf: [groupAll, groupDev],
            isActive: true,
            syncKey: '12345678900', // CPF/Matrícula
            phone: '+5511999999999', // Telefone validado
        });

        await userRepo.save([admin, devUser]);
        console.log('👤 Users created');

        // 8) Cria Notícias
        const newsRepo = AppDataSource.getRepository(NewsEntity);

        const news1 = newsRepo.create({
            title: 'Bem-vindo ao Iuppy!',
            subtitle: 'Sua nova plataforma de comunicação',
            content: '<p>Estamos muito felizes em ter você aqui.</p>',
            channelId: channelComunicados.id,
            authorId: admin.id,
            companyId: cid,
            // type: 'ANNOUNCEMENT' as any, // removed
            isPublished: true,
            publishedAt: new Date(),
            attachments: [],
            highlightImages: [],
            settings: {
                visibility: 'public',
                allowComments: true,
                allowReactions: true,
                showAuthor: true,
                showPublishDate: true,
                audienceMode: 'COMPANY', // Para todos
            } as any,
        });

        const news2 = newsRepo.create({
            title: 'Deploy realizado com sucesso',
            subtitle: 'Versão 2.0 está no ar',
            content: '<p>A nova versão inclui correções de bugs e melhorias de performance.</p>',
            channelId: channelTech.id,
            authorId: admin.id,
            companyId: cid,
            // type: 'UPDATE' as any, // removed
            isPublished: true,
            publishedAt: new Date(),
            attachments: [],
            highlightImages: [],
            settings: {
                visibility: 'public',
                allowComments: true,
                allowReactions: true,
                showAuthor: true,
                showPublishDate: true,
                audienceMode: 'SPACE',
                audienceSpaceId: spaceDev.id, // Focado no espaço Dev
            } as any,
        });

        await newsRepo.save([news1, news2]);
        console.log('📰 News created');

        console.log('✅ SEED COMPLETED SUCCESSFULLY!');
        console.log('------------------------------------------------');
        console.log('Company ID:', cid);
        console.log('Admin:', admin.email);
        console.log('Dev User:', devUser.email, '| CPF:', devUser.syncKey, '| Phone:', devUser.phone);
        console.log('------------------------------------------------');

        await AppDataSource.destroy();
    } catch (err: any) {
        console.error('❌ Seeding error:', err);
        process.exit(1);
    }
}

seed();
