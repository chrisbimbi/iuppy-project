import { AppDataSource } from '../config/data-source';
import { ChatConversationEntity } from '../chat/entities/chat-conversation.entity';
import { IsNull, Not } from 'typeorm';

async function fixDuplicates() {
    try {
        await AppDataSource.initialize();
        const repo = AppDataSource.getRepository(ChatConversationEntity);

        // Find all linked groups
        const linked = await repo.find({ where: { linkedGroupId: Not(IsNull()) } });

        const seen = new Set<string>();
        const toDelete: string[] = [];

        // Keep first, delete rest
        for (const c of linked) {
            if (seen.has(c.linkedGroupId)) {
                toDelete.push(c.id);
            } else {
                seen.add(c.linkedGroupId);
            }
        }

        if (toDelete.length > 0) {
            console.log(`Deleting ${toDelete.length} duplicates: ${toDelete.join(', ')}`);
            await repo.delete(toDelete);
        } else {
            console.log('No duplicates found.');
        }

    } catch (error) {
        console.error(error);
    } finally {
        await AppDataSource.destroy();
        process.exit(0);
    }
}

fixDuplicates();
