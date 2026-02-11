
import { AppDataSource } from '../config/data-source';

async function checkMigrations() {
    try {
        await AppDataSource.initialize();
        const tables = await AppDataSource.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
        console.log(JSON.stringify(tables, null, 2));

        await AppDataSource.destroy();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkMigrations();
