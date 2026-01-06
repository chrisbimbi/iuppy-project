import { AppDataSource } from '../config/data-source';
import { ChatConversationEntity } from '../chat/entities/chat-conversation.entity';

async function inspectChats() {
    try {
        await AppDataSource.initialize();
        const repo = AppDataSource.getRepository(ChatConversationEntity);
        const convs = await repo.find();

        console.log('--- Chat Conversations ---');
        console.table(convs.map(c => ({
            id: c.id,
            type: c.type,
            name: c.name,
            linkedGroupId: c.linkedGroupId,
            createdAt: c.createdAt
        })));

    } catch (error) {
        console.error(error);
    } finally {
        await AppDataSource.destroy();
        process.exit(0);
    }
}

inspectChats();
