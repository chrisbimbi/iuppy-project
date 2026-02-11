
import { AppDataSource } from '../config/data-source';
import { UserEntity } from '../users/user.entity';

async function fixUserCompany() {
    try {
        await AppDataSource.initialize();

        const targetCompanyId = 'fe509a18-daaa-4227-9bee-b7defbfbec7d'; // Iuppy Tech
        const email = 'admin@iuppy.com.br';

        const userRepo = AppDataSource.getRepository(UserEntity);
        const user = await userRepo.findOne({ where: { email } });

        if (!user) {
            console.log('User not found');
            return;
        }

        console.log(`Moving user ${user.name} from ${user.companyId} to ${targetCompanyId}`);
        user.companyId = targetCompanyId;
        await userRepo.save(user);
        console.log('✅ User updated successfully.');

    } catch (e) {
        console.error(e);
    } finally {
        await AppDataSource.destroy();
    }
}

fixUserCompany();
