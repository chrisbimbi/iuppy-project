import { AppDataSource } from '../config/data-source';
import { UserEntity } from '../users/user.entity';

async function updateDemoUsersCPF() {
    console.log('🔧 Updating demo users with CPF in registrationNumber...');
    await AppDataSource.initialize();

    const userRepo = AppDataSource.getRepository(UserEntity);

    const demoUsers = [
        { email: 'julia.silva@demo.com.br', cpf: '12345678900' },
        { email: 'roberto.almeida@demo.com.br', cpf: '23456789011' },
        { email: 'ana.costa@demo.com.br', cpf: '34567890122' },
        { email: 'lucas.pereira@demo.com.br', cpf: '45678901233' },
        { email: 'fernanda.lima@demo.com.br', cpf: '56789012344' }
    ];

    for (const userData of demoUsers) {
        const user = await userRepo.findOne({ where: { email: userData.email } });
        if (user) {
            user.registrationNumber = userData.cpf;
            user.customAttributes = {
                ...user.customAttributes,
                cpf: userData.cpf
            };
            await userRepo.save(user);
            console.log(`✅ Updated ${user.name}: CPF=${userData.cpf}`);
        } else {
            console.log(`❌ User not found: ${userData.email}`);
        }
    }

    console.log('✅ All demo users updated!');
    await AppDataSource.destroy();
}

updateDemoUsersCPF().catch((err) => {
    console.error('❌ Failed:', err);
    process.exit(1);
});
