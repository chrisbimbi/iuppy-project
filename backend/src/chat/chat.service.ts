import { Injectable, ForbiddenException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan, MoreThan } from 'typeorm';
import { ChatConversationEntity, ConversationType } from './entities/chat-conversation.entity';
import { ChatParticipantEntity, ChatRole } from './entities/chat-participant.entity';
import { ChatMessageEntity, MessageType } from './entities/chat-message.entity';
import { HiddenMessageEntity } from './entities/hidden-message.entity';
import { ChatGateway } from './chat.gateway';
import { GroupsService } from '../groups/groups.service';
import { CommunicationsService } from '../notifications/communications.service';
import { UserEntity } from '../users/user.entity';
import * as typeorm_1 from 'typeorm';

@Injectable()
export class ChatService {
    constructor(
        @InjectRepository(ChatConversationEntity)
        private conversationRepo: Repository<ChatConversationEntity>,
        @InjectRepository(ChatParticipantEntity)
        private participantRepo: Repository<ChatParticipantEntity>,
        @InjectRepository(ChatMessageEntity)
        private messageRepo: Repository<ChatMessageEntity>,
        @InjectRepository(HiddenMessageEntity)
        private hiddenRepo: Repository<HiddenMessageEntity>,
        @InjectRepository(UserEntity)
        private userRepo: Repository<UserEntity>,
        private groupsService: GroupsService,
        private communications: CommunicationsService,
        @Inject(forwardRef(() => ChatGateway))
        private chatGateway: ChatGateway,
    ) { }

    async createConversation(userIds: string[], name?: string): Promise<ChatConversationEntity> {
        // Basic logic: if 2 users, check if direct exists
        const type = userIds.length > 2 ? ConversationType.GROUP : ConversationType.DIRECT;

        if (type === ConversationType.DIRECT) {
            // Robust deduplication using QueryBuilder
            const qb = this.conversationRepo.createQueryBuilder('c');
            qb.innerJoin('c.participants', 'p1', 'p1.userId = :u1', { u1: userIds[0] });
            qb.innerJoin('c.participants', 'p2', 'p2.userId = :u2', { u2: userIds[1] });
            qb.where('c.type = :type', { type: ConversationType.DIRECT });

            const existing = await qb.getOne();
            if (existing) {
                return existing;
            }
        }

        const conv = this.conversationRepo.create({
            type,
            name: type === ConversationType.GROUP ? name : undefined,
            lastMessageAt: new Date(),
        });
        const saved = await this.conversationRepo.save(conv);

        const participants = userIds.map(uid => this.participantRepo.create({
            conversationId: saved.id,
            userId: uid,
            role: ChatRole.MEMBER
        }));
        await this.participantRepo.save(participants);

        return saved;
    }

    async getUserConversations(userId: string) {
        console.log(`[ChatService] Getting conversations for user: ${userId}`);
        // 1. Direct Conversations
        const participants = await this.participantRepo.find({
            where: { userId, isArchived: false },
            relations: ['conversation', 'conversation.participants', 'conversation.participants.user'],
        });
        console.log(`[ChatService] Found ${participants.length} direct participations`);
        const directConvs = participants.map(p => p.conversation);

        // 2. Group-Based Conversations (where boolean isChatEnabled is true)
        // Find all groups user belongs to
        const userGroups = await this.groupsService.findUserGroups(userId); // Need to add this method to GroupsService
        console.log(`[ChatService] User belongs to ${userGroups.length} groups`);
        const chatEnabledGroups = userGroups.filter(g => g.isChatEnabled);
        console.log(`[ChatService] Of which ${chatEnabledGroups.length} have chat enabled`);

        let groupConvs: ChatConversationEntity[] = [];
        if (chatEnabledGroups.length > 0) {
            // Find or Create conversation for each group
            // Ideally we shouldn't create on read, but for MVP it ensures consistency.
            // Or we just query existing ones.
            const groupIds = chatEnabledGroups.map(g => g.id);

            // Check which ones already exist
            const existing = await this.conversationRepo.find({
                where: { linkedGroupId: In(groupIds) },
                relations: ['participants', 'participants.user'] // Assuming ChatConversationEntity has participants
            });

            // Identify missing
            const existingGroupIds = new Set(existing.map(c => c.linkedGroupId));
            const missingGroups = chatEnabledGroups.filter(g => !existingGroupIds.has(g.id));

            const newConvs = [];
            for (const g of missingGroups) {
                const c = this.conversationRepo.create({
                    type: ConversationType.GROUP,
                    name: g.name,
                    linkedGroupId: g.id,
                    lastMessageAt: new Date(),
                });
                newConvs.push(c);
            }
            if (newConvs.length > 0) await this.conversationRepo.save(newConvs);

            groupConvs = [...existing, ...newConvs];
        }

        // Merge and Sort
        const all = [...directConvs, ...groupConvs];

        // Deduplicate by ID
        const unique = Array.from(new Map(all.map(c => [c.id, c])).values());

        // Populate lastMessage and Read Status
        for (const c of unique) {
            const lastMsg = await this.messageRepo.findOne({
                where: { conversationId: c.id },
                order: { createdAt: 'DESC' }
            });
            if (lastMsg) {
                // Check if read (Simplification for Direct)
                let isRead = false;
                if (c.type === 'DIRECT') {
                    // Check other participant
                    const other = c.participants?.find(p => p.userId !== userId);
                    // Note: Participants might not be fully loaded if sourced from group logic, 
                    // but for Direct they are loaded in step 1.
                    if (other && other.lastReadAt && other.lastReadAt >= lastMsg.createdAt) {
                        isRead = true;
                    }
                } else {
                    // Group logic: Read if ALL others read? OR simply just show sent.
                    // For now leave as false (grey ticks)
                }

                (c as any).lastMessage = {
                    ...lastMsg,
                    readStatus: isRead ? 'READ' : 'SENT'
                };
            }
        }

        return unique.sort((a, b) => {
            const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
            const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
            return timeB - timeA;
        });
    }

    async getMessages(conversationId: string, userId: string, limit: number, before?: string) {
        // Verify participation OR Group Membership
        const conversation = await this.conversationRepo.findOne({ where: { id: conversationId } });
        if (!conversation) throw new NotFoundException('Conversation not found');

        let hasAccess = false;

        // 1. Check direct participation
        const p = await this.participantRepo.findOne({ where: { conversationId, userId } });
        if (p) hasAccess = true;

        // 2. Check Linked Group
        if (!hasAccess && conversation.linkedGroupId) {
            hasAccess = await this.groupsService.isMember(conversation.linkedGroupId, userId);
        }

        if (!hasAccess) throw new ForbiddenException('Not a participant');

        const where: any = { conversationId };
        if (before) {
            where.createdAt = typeorm_1.Between(
                p?.clearedHistoryAt || new Date(0),
                new Date(before)
            );
        } else {
            where.createdAt = typeorm_1.MoreThan(p?.clearedHistoryAt || new Date(0));
        }

        const messages = await this.messageRepo.find({
            where,
            order: { createdAt: 'DESC' },
            take: limit,
            relations: ['sender'],
            withDeleted: true // Include deleted messages to show "🚫 Mensagem apagada"
        });

        // Filter out hidden messages (Delete for Me)
        if (messages.length === 0) return [];

        const hidden = await this.hiddenRepo.find({
            where: { userId, messageId: In(messages.map(m => m.id)) }
        });
        const hiddenIds = new Set(hidden.map(h => h.messageId));
        const visibleMessages = messages.filter(m => !hiddenIds.has(m.id));

        // Calculate Read Status for each message
        // Optimization: Fetch unique participants once
        // For Direct: finding the 'other' is enough.
        const participants = await this.participantRepo.find({ where: { conversationId } });

        const enriched = visibleMessages.map(m => {
            let readStatus = 'SENT';
            if (m.senderId === userId) {
                // Check if others have read it
                const others = participants.filter(p => p.userId !== userId);
                if (others.length > 0) {
                    // Check if *any* other has read it (for group: partial read? usually list shows read by whom)
                    // For ticks: Blue if *everyone* read? 
                    // Let's go with: If Direct, check single. If Group, check All.
                    const allRead = others.every(p => p.lastReadAt && p.lastReadAt >= m.createdAt);
                    if (allRead) readStatus = 'READ';
                }
            }
            return { ...m, readStatus };
        });

        return enriched;
        // We need sender info. ChatMessageEntity likely doesn't have 'sender' relation defined in the file I viewed earlier?
        // Let's check ChatMessageEntity.ts again or just use query builder.
        // Actually, if I look at ChatMessageEntity (Step 10667), it does NOT have @ManyToOne user.
        // It has senderId column.
        // I should add the relation to ChatMessageEntity first? Or manually fetch?
        // Adding relation is better.
        // But to be quick/safe, I can just fetch users? No, too slow.
        // I will add the relation to ChatMessageEntity.
    }

    async saveMessage(conversationId: string, senderId: string, content: string, type: MessageType = MessageType.TEXT, metadata?: any, replyToId?: string) {
        // PERMISSION CHECK
        const conversation = await this.conversationRepo.findOne({ where: { id: conversationId }, relations: ['participants', 'participants.user'] });
        if (!conversation) throw new NotFoundException('Conversation not found');

        let hasAccess = false;
        const p = await this.participantRepo.findOne({ where: { conversationId, userId: senderId } });
        if (p) hasAccess = true;

        if (!hasAccess && conversation.linkedGroupId) {
            hasAccess = await this.groupsService.isMember(conversation.linkedGroupId, senderId);
        }

        if (!hasAccess) throw new ForbiddenException('Not a participant');

        // One query to get original message and its sender if replyToId exists
        let replySnapshot = undefined;
        let replyToMsgId = undefined;

        if (replyToId) {
            const original = await this.messageRepo.findOne({ where: { id: replyToId } });
            if (original && original.conversationId === conversationId) {
                replyToMsgId = original.id;
                // Fetch sender name for snapshot
                const senderP = await this.participantRepo.findOne({
                    where: { userId: original.senderId, conversationId },
                    relations: ['user']
                });

                replySnapshot = {
                    id: original.id,
                    content: original.content?.substring(0, 100) || 'Mídia/Arquivo',
                    senderName: senderP?.user?.name || 'Usuário'
                };
            }
        }

        const msg = this.messageRepo.create({
            conversationId,
            senderId,
            content,
            type,
            metadata: metadata || {},
            replyToId: replyToMsgId,
            replySnapshot
        });
        const saved = await this.messageRepo.save(msg);

        // Update conversation timestamp
        await this.conversationRepo.update(conversationId, { lastMessageAt: new Date() });

        // --- PUSH NOTIFICATION ---
        this.sendPushNotification(conversation, saved, senderId);
        // -------------------------

        return saved;
    }

    private async sendPushNotification(conversation: ChatConversationEntity, message: ChatMessageEntity, senderId: string) {
        try {
            // Fetch sender to get companyId
            const sender = await this.userRepo.findOne({ where: { id: senderId }, select: ['companyId'] });
            if (!sender || !sender.companyId) {
                console.error('[ChatService] Could not find sender or companyId for push notification');
                return;
            }

            // Identify recipients
            let recipientIds: string[] = [];

            // For Direct: other participants
            if (conversation.type === ConversationType.DIRECT) {
                // Assuming relations are loaded or we fetch them
                const parts = conversation.participants || (await this.participantRepo.find({ where: { conversationId: conversation.id } }));
                recipientIds = parts.map(p => p.userId).filter(uid => uid !== senderId);
            }
            // For Group: linked group members
            else if (conversation.linkedGroupId) {
                // Fetch group members
                const members = await this.groupsService.findMembers(conversation.linkedGroupId);
                recipientIds = members.map(u => u.id).filter(uid => uid !== senderId);
            } else {
                // Standalone group chat (manual participants)
                const parts = conversation.participants || (await this.participantRepo.find({ where: { conversationId: conversation.id } }));
                recipientIds = parts.map(p => p.userId).filter(uid => uid !== senderId);
            }

            if (recipientIds.length === 0) return;

            // Sender Name (quick fetch)
            const title = conversation.type === ConversationType.GROUP
                ? (conversation.name || 'Novo Grupo')
                : 'Nova Mensagem';

            const body = message.type === MessageType.IMAGE ? '📷 Imagem'
                : message.type === MessageType.VOICE ? '🎤 Áudio'
                    : message.type === MessageType.FILE ? '📁 Arquivo'
                        : message.content;

            // Iterate recipients to calculate badge and send individual push
            // Optimized approach would be to calculate all at once or background job
            for (const recipientId of recipientIds) {
                // Calculate unread count for this user
                // We reuse getUnreadCount logic but simplified or called directly
                // Note: getUnreadCount might be heavy if called in loop for 1000 users. 
                // For MVP/Beta it is acceptable.
                const unreadStats = await this.getUnreadCount(recipientId);
                const badgeCount = unreadStats.total;

                await this.communications.sendPush({
                    companyId: sender.companyId,
                    userIds: [recipientId],
                    title: title,
                    body: body,
                    kind: 'CHAT_MESSAGE',
                    entityId: conversation.id,
                    badge: badgeCount, // Send the calculated badge
                    data: {
                        type: 'chat',
                        conversationId: conversation.id,
                        deepLink: `/chat/${conversation.id}`
                    }
                });
            }

        } catch (e) {
            console.error('Error sending chat push', e);
        }
    }

    async toggleReaction(messageId: string, userId: string, reaction: string) {
        const message = await this.messageRepo.findOne({ where: { id: messageId } });
        if (!message) throw new NotFoundException('Message not found');

        const reactions = message.reactions || {};

        // Check if user already has THIS reaction
        const hasThis = reactions[reaction]?.some(u => u.id === userId);

        // Staffbase Logic: User can only have ONE reaction per message.
        // Remove user from ALL keys.
        for (const k in reactions) {
            if (Array.isArray(reactions[k])) {
                reactions[k] = reactions[k].filter(u => u.id !== userId);
                if (reactions[k].length === 0) delete reactions[k];
            }
        }

        // If they didn't have it, add it back (Toggle ON)
        if (!hasThis) {
            // Fetch Name
            let name = 'Usuário';
            const p = await this.participantRepo.findOne({
                where: { conversationId: message.conversationId, userId },
                relations: ['user']
            });
            if (p?.user?.name) name = p.user.name;

            if (!reactions[reaction]) reactions[reaction] = [];
            reactions[reaction].push({ id: userId, name });
        }

        message.reactions = reactions;
        return this.messageRepo.save(message);
    }

    async markAsRead(conversationId: string, userId: string) {
        // If participant exists
        const p = await this.participantRepo.findOne({ where: { conversationId, userId } });
        if (p) {
            await this.participantRepo.update(
                { conversationId, userId },
                { lastReadAt: new Date() }
            );
        } else {
            // Create participant if group member implicit? 
            // Logic might vary, for now let's assume explicit participation
        }
    }

    async getUnreadCount(userId: string) {
        // Complex because "unread" means message.createdAt > participant.lastReadAt
        // We can approximate by checking participant.lastReadAt vs conversation.lastMessageAt
        // BUT strict count requires counting messages.

        // Let's do a simpler "has unread" check or approximate count 
        // 1. Get all conversations user is in
        const conversations = await this.getUserConversations(userId);

        let totalUnread = 0;
        const byConversation: Record<string, number> = {};

        for (const c of conversations) {
            // Find participant record for this user
            // getUserConversations loads participants.
            const p = c.participants?.find((p: any) => p.userId === userId);
            const lastRead = p?.lastReadAt || new Date(0); // If never read, ancient date

            if (c.lastMessageAt > lastRead) {
                // Count how many messages since lastRead
                const count = await this.messageRepo.count({
                    where: {
                        conversationId: c.id,
                        createdAt: typeorm_1.MoreThan(lastRead),
                        senderId: typeorm_1.Not(userId) // Don't count own messages
                    } as any
                });
                if (count > 0) {
                    totalUnread += count;
                    byConversation[c.id] = count;
                }
            }
        }

        return { total: totalUnread, byConversation };
    }

    async clearHistory(conversationId: string, userId: string) {
        let p = await this.participantRepo.findOne({ where: { conversationId, userId } });
        if (!p) {
            // Check if implicit member, if so create explicit participant to store state
            const conversation = await this.conversationRepo.findOne({ where: { id: conversationId } });
            if (conversation?.linkedGroupId && await this.groupsService.isMember(conversation.linkedGroupId, userId)) {
                p = this.participantRepo.create({ conversationId, userId });
            } else {
                throw new ForbiddenException();
            }
        }

        p.clearedHistoryAt = new Date();
        // Also archive it visually until new message comes? Optional.
        // p.isArchived = true; 
        await this.participantRepo.save(p);
    }

    async getMessageInfo(messageId: string, userId: string) {
        const msg = await this.messageRepo.findOne({ where: { id: messageId } });
        if (!msg) throw new NotFoundException();

        // Check permission
        const p = await this.participantRepo.findOne({ where: { conversationId: msg.conversationId, userId } });
        if (!p) throw new ForbiddenException();

        const participants = await this.participantRepo.find({
            where: { conversationId: msg.conversationId },
            relations: ['user']
        });

        const readBy = participants
            .filter(p => p.userId !== msg.senderId && p.lastReadAt && p.lastReadAt >= msg.createdAt)
            .map(p => ({
                user: p.user,
                readAt: p.lastReadAt // Approximate
            }));

        // Delivered By? Hard without Push Ack. 
        // Assuming if they have a session or pushed successfully? Too complex for now.

        return {
            sentAt: msg.createdAt,
            readBy
        };
    }


    async addParticipant(conversationId: string, adminId: string, newUserId: string) {
        await this.ensureAdmin(conversationId, adminId);
        // Check if already in
        const exists = await this.participantRepo.findOne({ where: { conversationId, userId: newUserId } });
        if (exists) return;

        const p = this.participantRepo.create({ conversationId, userId: newUserId, role: ChatRole.MEMBER });
        await this.participantRepo.save(p);
    }

    async removeParticipant(conversationId: string, adminId: string, targetUserId: string) {
        await this.ensureAdmin(conversationId, adminId);
        await this.participantRepo.delete({ conversationId, userId: targetUserId });
    }

    async promoteToAdmin(conversationId: string, adminId: string, targetUserId: string) {
        await this.ensureAdmin(conversationId, adminId);
        await this.participantRepo.update({ conversationId, userId: targetUserId }, { role: ChatRole.ADMIN });
    }

    private async ensureAdmin(conversationId: string, userId: string) {
        const p = await this.participantRepo.findOne({ where: { conversationId, userId } });
        if (!p || p.role !== ChatRole.ADMIN) {
            // If linked group, check if group admin? For now only explicit chat admins.
            throw new ForbiddenException('Admin Only');
        }
    }

    async deleteMessage(messageId: string, userId: string) {
        const msg = await this.messageRepo.findOne({ where: { id: messageId } });
        if (!msg) throw new NotFoundException('Message not found');
        if (msg.senderId !== userId) throw new ForbiddenException('You can only delete your own messages');

        // Soft delete but keep the row visible as "Deleted"
        msg.content = '';
        msg.metadata = { isDeleted: true };
        msg.deletedAt = new Date(); // Manually set deletedAt

        await this.messageRepo.save(msg);

        // Real-time Update
        this.chatGateway.server.to(msg.conversationId).emit('messageUpdated', msg);

        return { message: 'Message deleted' };
    }

    async deleteMessageForMe(messageId: string, userId: string) {
        const msg = await this.messageRepo.findOne({ where: { id: messageId } });
        if (!msg) throw new NotFoundException('Message not found');

        // Check if already hidden
        const hidden = await this.hiddenRepo.findOne({ where: { messageId, userId } });
        if (!hidden) {
            const h = this.hiddenRepo.create({ messageId, userId });
            await this.hiddenRepo.save(h);
        }

        return { message: 'Message deleted for you' };
    }
}
