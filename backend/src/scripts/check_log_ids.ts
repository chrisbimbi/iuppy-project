
import { DataSource } from 'typeorm';
import { UserEntity } from '../users/user.entity';
import { CompanyEntity } from '../companies/company.entity';
import { GroupEntity } from '../groups/group.entity';
import { UserSpaceEntity } from '../spaces/user-space.entity';
import { UserXPHistoryEntity } from '../modules/gamification/entities/user-xp-history.entity';
import { SpaceEntity } from '../spaces/space.entity';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config();

// Stub entities if imports fail or are too deep tree
// But better to use real ones if path is correct.
// UserEntity pulls in: GroupEntity, UserXPHistoryEntity, UserSpaceEntity
// GroupEntity might pull in others.
// Simplest way: just load ALL entities from keys in AppDataSource?
// Or just add the missing ones.

async function checkPort(port: number) {
    console.log(`\n🔌 Connecting to Port ${port}...`);
    const ds = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: port,
        username: process.env.DB_USERNAME || 'iuppy_user',
        password: process.env.DB_PASSWORD || 'Iuppy2025',
        database: process.env.DB_NAME || 'iuppy_dev',
        entities: [
            UserEntity,
            CompanyEntity,
            GroupEntity,
            UserSpaceEntity,
            UserXPHistoryEntity,
            SpaceEntity
            // Add more if relation errors persist
        ],
        synchronize: false,
    });

    try {
        await ds.initialize();
        console.log(`✅ Connected to Port ${port}.`);

        const idsToCheck = ['000c0911-58b3-4c80-84bc-fe015eec1961', '2030f9d6-9d8f-4b47-b206-e19a753a91d8'];

        // Check Companies
        for (const id of idsToCheck) {
            const company = await ds.getRepository(CompanyEntity).findOne({ where: { id } });
            if (company) console.log(`👉 [Port ${port}] FOUND COMPANY: ${company.name} (${company.id})`);
        }

        // Check Users
        for (const id of idsToCheck) {
            // Use query builder to avoid relation loading issues if any
            const user = await ds.getRepository(UserEntity)
                .createQueryBuilder('user')
                .where('user.id = :id', { id })
                .getOne();

            if (user) console.log(`👉 [Port ${port}] FOUND USER: ${user.name} (${user.email}) | Company: ${user.companyId}`);
        }

        await ds.destroy();
    } catch (e) {
        console.log(`❌ Failed to connect/query Port ${port}:`, (e as Error).message);
    }
}

async function run() {
    await checkPort(5432);
}

run();
