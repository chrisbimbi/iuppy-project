
import { AppDataSource } from '../config/data-source';
import { UserEntity } from '../users/user.entity';
import { CompanyEntity } from '../companies/company.entity';

async function checkState() {
    try {
        await AppDataSource.initialize();
        console.log('✅ Connected to DB:', AppDataSource.options.database);

        // 1. Check Company
        const targetId = '2af4557f-9259-4eed-818d-1d0ffe0b8982';
        const company = await AppDataSource.getRepository(CompanyEntity).findOne({ where: { id: targetId } });
        console.log(`\n🏢 Searching for Company ${targetId}:`);
        if (company) {
            console.log(`FOUND: ${company.name} (ID: ${company.id})`);
        } else {
            console.log('NOT FOUND.');
        }

        console.log('\n🏢 All Companies:');
        const allCompanies = await AppDataSource.getRepository(CompanyEntity).find();
        allCompanies.forEach(c => console.log(`- ${c.name} (${c.id})`));

        // 2. Check Users
        const specificEmails = ['dev@iuppy.com.br', 'admin@iuppy.com.br'];
        console.log(`\n👥 Searching for Users: ${specificEmails.join(', ')}`);

        const users = await AppDataSource.getRepository(UserEntity)
            .createQueryBuilder('user')
            .where('user.email IN (:...emails)', { emails: specificEmails })
            .getMany();

        if (users.length > 0) {
            users.forEach(u => console.log(`FOUND User: ${u.email} | CompanyID: ${u.companyId} | Role: ${u.role}`));
        } else {
            console.log('NO USERS FOUND with these emails.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await AppDataSource.destroy();
    }
}

checkState();
