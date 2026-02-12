import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { UserEntity } from '../users/user.entity';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    const userRepo = dataSource.getRepository(UserEntity);

    console.log('🔍 Debugging User Access for Ana Costa...');

    // CPF: 34567890122 -> From previous step, likely Ana Costa
    // Email: ana.costa@demo.com.br
    const email = 'ana.costa@demo.com.br';
    const user = await userRepo.findOne({ where: { email } });

    if (!user) {
        console.log('❌ User not found!');
        await app.close();
        return;
    }

    console.log(`User Found: ${user.name} (${user.id})`);
    console.log(`User.groups (column): ${JSON.stringify(user.groups)}`);

    // Check user_group_members table
    const groups = await dataSource.query(`
        SELECT g.id, g.name 
        FROM user_group g
        JOIN user_group_members gm ON gm.group_id = g.id
        WHERE gm.user_id = $1
    `, [user.id]);

    console.log(`\nUser Group Memberships (${groups.length}):`);
    groups.forEach(g => console.log(` - ${g.name} (${g.id})`));

    // Check user_space_entity table
    const spaces = await dataSource.query(`
        SELECT s.id, s.name, us.role
        FROM space s
        JOIN user_space_entity us ON us."spaceId" = s.id
        WHERE us."userId" = $1
    `, [user.id]);

    console.log(`\nUser Space Assignments (${spaces.length}):`);
    spaces.forEach(s => console.log(` - ${s.name} (${s.role})`));

    // Check 'Todos' group existence
    const todosGroup = await dataSource.query(`SELECT * FROM user_group WHERE name = 'Todos'`);
    console.log(`\n'Todos' Group exists? ${todosGroup.length > 0 ? 'YES' : 'NO'}`);
    if (todosGroup.length > 0) console.log(`Todos ID: ${todosGroup[0].id}`);

    await app.close();
}

bootstrap();
