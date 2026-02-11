
import { AppDataSource } from '../config/data-source';
import { CompanyEntity } from '../companies/company.entity';
import { SpaceEntity } from '../spaces/space.entity';
import { Channel } from '../channels/channel.entity';
import { UserEntity } from '../users/user.entity';

async function debugState() {
    try {
        await AppDataSource.initialize();

        const companies = await AppDataSource.getRepository(CompanyEntity).find();
        console.log('🏢 COMPANIES:');
        for (const c of companies) {
            console.log(`- [${c.id}] ${c.name}`);

            const spaces = await AppDataSource.getRepository(SpaceEntity).find({ where: { companyId: c.id } });
            console.log(`  🏠 Spaces (${spaces.length}):`);
            spaces.forEach(s => console.log(`    - [${s.id}] ${s.name} (Slug: ${s.slug})`));

            const channels = await AppDataSource.getRepository(Channel).find({ where: { companyId: c.id } });
            console.log(`  📢 Channels (${channels.length}):`);
            channels.forEach(ch => console.log(`    - [${ch.id}] ${ch.name} (Type: ${ch.type})`));
        }

        console.log('\n👤 ADMIN USER:');
        const admin = await AppDataSource.getRepository(UserEntity).findOne({ where: { email: 'admin@iuppy.com.br' } });
        if (admin) {
            console.log(`- [${admin.id}] ${admin.name} -> Company: ${admin.companyId}`);
        } else {
            console.log('- Not Found');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await AppDataSource.destroy();
    }
}

debugState();
