
import 'dotenv/config';
import { AppDataSource } from '../src/config/data-source';
import { UserEntity } from '../src/users/user.entity';
import { CompanyEntity } from '../src/companies/company.entity';
import { Role } from '@shared/types/Role';
import { v4 as uuidv4 } from 'uuid';
import * as argon2 from 'argon2';

async function run() {
    try {
        await AppDataSource.initialize();
        console.log('files initialized');

        const userRepo = AppDataSource.getRepository(UserEntity);
        const companyRepo = AppDataSource.getRepository(CompanyEntity);

        const email = 'admin@iuppy.com.br';
        let user = await userRepo.findOne({ where: { email } });

        if (user) {
            console.log('✅ Admin user already exists. Updating password to 123...');
            user.password = await argon2.hash('123');
            await userRepo.save(user);
            console.log('✅ Password updated.');
        } else {
            console.log('⚠️ Admin user does NOT exist. Creating...');

            // Need a company first
            let company = await companyRepo.findOne({ where: {} }); // Pick first company
            if (!company) {
                console.log('⚠️ No company found. Creating one...');
                company = companyRepo.create({
                    name: 'Test Company',
                    description: 'Created by verify script',
                });
                await companyRepo.save(company);
            }

            user = userRepo.create({
                email,
                name: 'Admin Test',
                displayName: 'Admin',
                password: await argon2.hash('123'),
                role: Role.CompanyAdmin,
                companyId: company.id,
                isActive: true,
            });
            await userRepo.save(user);
            console.log(`✅ Admin user created for company ${company.id}`);
        }

        await AppDataSource.destroy();
    } catch (e) {
        console.error('❌ detailed error: ', e);
        process.exit(1);
    }
}

run();
