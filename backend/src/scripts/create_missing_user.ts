
import { AppDataSource } from '../config/data-source';
import { UserEntity } from '../users/user.entity';

async function createMissingUser() {
    try {
        await AppDataSource.initialize();

        const companyId = '2af4557f-9259-4eed-818d-1d0ffe0b8982'; // Iuppy Tech
        const phone = '12345678910';
        const displayName = 'Chris';

        const userRepo = AppDataSource.getRepository(UserEntity);
        let user = await userRepo.findOne({ where: { phone } });

        if (user) {
            console.log('✅ User already exists:', user.id);
            if (user.companyId !== companyId) {
                console.log('Updating company...');
                user.companyId = companyId;
                await userRepo.save(user);
            }
        } else {
            console.log('Creating user Chris...');
            user = userRepo.create({
                name: displayName,
                email: 'chris.mobile@iuppy.com.br',
                password: 'hash', // Dummy hash
                displayName: displayName,
                phone: phone,
                companyId: companyId,
                isActive: true,
                role: 'user' as any, // Standard user
                groups: []
            });
            await userRepo.save(user);
            console.log('✅ User created:', user.id);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await AppDataSource.destroy();
    }
}

createMissingUser();
