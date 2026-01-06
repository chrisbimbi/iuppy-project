import { AppDataSource } from '../config/data-source';

async function resetChat() {
    try {
        console.log('Initializing Data Source...');
        await AppDataSource.initialize();

        console.log('Truncating Chat Tables...');
        const queryRunner = AppDataSource.createQueryRunner();

        // Using CASCADE to clean up participants and messages automatically
        await queryRunner.query('TRUNCATE TABLE "chat_conversation" CASCADE');

        console.log('✅ Chat tables cleaned successfully.');
    } catch (error) {
        console.error('❌ Error resetting chat:', error);
    } finally {
        await AppDataSource.destroy();
        process.exit(0);
    }
}

resetChat();
