
import { AppDataSource } from '../config/data-source';
import { UserEntity } from '../users/user.entity';

async function migrateUsers() {
    try {
        await AppDataSource.initialize();
        console.log('✅ DB Connected.');

        const targetCompanyId = '2af4557f-9259-4eed-818d-1d0ffe0b8982';
        const emailsToMigrate = [
            'dev@iuppy.com.br',
            'admin@iuppy.com.br',
            'test12345678900@example.com',
            'user12345678@iuppy.com.br',
            'marketing@iuppy.com.br'
        ];

        console.log(`🚀 Migrating users to Company ID: ${targetCompanyId}...`);

        const userRepo = AppDataSource.getRepository(UserEntity);
        const users = await userRepo
            .createQueryBuilder('user')
            .where('user.email IN (:...emails)', { emails: emailsToMigrate })
            .getMany();

        if (users.length === 0) {
            console.log('⚠️ No users found to migrate.');
            return;
        }

        for (const user of users) {
            console.log(`🔄 Moving ${user.email} (was ${user.companyId})...`);
            user.companyId = targetCompanyId;
            await userRepo.save(user);
        }

        console.log('✅ MIGRATION COMPLETE. Users should now access the new content.');

    } catch (error) {
        console.error('❌ Error migrating users:', error);
    } finally {
        await AppDataSource.destroy();
    }
}

migrateUsers();
