
import { AppDataSource } from '../config/data-source';
import { QueryRunner } from 'typeorm';

async function checkTable() {
    try {
        await AppDataSource.initialize();
        const queryRunner = AppDataSource.createQueryRunner();
        const table = await queryRunner.getTable('one_on_ones');
        if (table) {
            console.log('Table one_on_ones exists.');
            console.log('Columns:', table.columns.map(c => c.name));
        } else {
            console.log('Table one_on_ones does NOT exist.');
        }
        await AppDataSource.destroy();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkTable();
