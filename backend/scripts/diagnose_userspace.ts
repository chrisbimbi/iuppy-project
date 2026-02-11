
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

const DB_HOST = 'localhost';
const DB_PORT = 5433; // Docker port
const DB_USER = 'iuppy_admin';
const DB_PASS = 'Iuppy#2025';
const DB_NAME = 'iuppy_dev';

console.log(`Connecting to ${DB_HOST}:${DB_PORT} / ${DB_NAME} as ${DB_USER}...`);

const AppDataSource = new DataSource({
    type: 'postgres',
    host: DB_HOST,
    port: DB_PORT,
    username: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
});

async function run() {
    try {
        await AppDataSource.initialize();
        console.log('Database connected.');

        const columns = await AppDataSource.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'user_space_entity';
    `);

        console.log('Columns in user_space_entity:', columns);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        if (AppDataSource.isInitialized) await AppDataSource.destroy();
    }
}

run();
