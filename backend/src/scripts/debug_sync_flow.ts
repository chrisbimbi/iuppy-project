
import { DataSource } from 'typeorm';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);

    console.log('🐞 Debugging Sync Flow State...');

    try {
        const providers = await dataSource.query('SELECT * FROM integration_providers');
        console.log('🏢 Providers:', providers.map(p => p.key));

        const connections = await dataSource.query('SELECT * FROM integration_connections');
        console.log('🔗 Connections:', connections.map(c => ({ id: c.id, provider: c.provider_key, company: c.company_id })));

        const configs = await dataSource.query('SELECT * FROM integration_configs');
        console.log('⚙️ Configs:', configs.map(c => ({ id: c.id, connId: c.connection_id, mapping: c.field_mapping ? 'EXISTS' : 'EMPTY' })));

        const userCount = await dataSource.query('SELECT count(*) FROM user_entity');
        console.log(`👥 Total Users: ${userCount[0].count}`);

    } catch (err) {
        console.error('❌ Debug Query Failed:', err.message);
    }

    await app.close();
}

bootstrap();
