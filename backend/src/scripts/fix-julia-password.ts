import { AppDataSource } from '../config/data-source';
import { UserEntity } from '../users/user.entity';
import * as argon2 from 'argon2';

async function updateJuliaPassword() {
    console.log('🔧 Updating Julia\'s password...');
    await AppDataSource.initialize();

    const userRepo = AppDataSource.getRepository(UserEntity);

    const julia = await userRepo.findOne({ where: { email: 'julia.silva@demo.com.br' } });

    if (!julia) {
        console.error('❌ Julia not found!');
        process.exit(1);
    }

    console.log('👤 Found Julia:', julia.email, 'Role:', julia.role);

    // Update password to demo123
    const newPassword = await argon2.hash('demo123');
    julia.password = newPassword;

    // Ensure role is company_admin
    julia.role = 'company_admin' as any;

    // 4. ✅ Set CPF if missing
    if (!julia.customAttributes?.cpf && !julia.registrationNumber) {
        julia.registrationNumber = '12345678900';
        julia.customAttributes = { ...julia.customAttributes, cpf: '12345678900' };
        console.log('   ✅ Added CPF/Registration Number');
    }

    await userRepo.save(julia);

    console.log('✅ Julia updated successfully!');
    console.log('   Email:', julia.email);
    console.log('   Role:', julia.role);
    console.log('   Registration Number:', julia.registrationNumber);
    console.log('   Password: demo123 (hash updated)');

    await AppDataSource.destroy();
}

updateJuliaPassword().catch((err) => {
    console.error('❌ Failed:', err);
    process.exit(1);
});
