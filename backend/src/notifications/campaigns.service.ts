import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommunicationCampaignEntity, CampaignStatus } from './entities/communication-campaign.entity';
import { CommunicationsService } from './communications.service';

@Injectable()
export class CampaignsService {
    private readonly logger = new Logger('CampaignsService');

    constructor(
        @InjectRepository(CommunicationCampaignEntity)
        private readonly repo: Repository<CommunicationCampaignEntity>,
        private readonly comms: CommunicationsService,
    ) { }

    async list(companyId: string) {
        return this.repo.find({
            where: { company_id: companyId },
            order: { created_at: 'DESC' },
        });
    }

    async upsert(companyId: string, dto: Partial<CommunicationCampaignEntity>) {
        const entity = this.repo.create({
            ...dto,
            company_id: companyId,
        });
        return this.repo.save(entity);
    }

    async getStats(companyId: string, id: string) {
        const campaign = await this.repo.findOneBy({ id, company_id: companyId });
        if (!campaign) throw new NotFoundException('Campaign not found');

        // In a real scenario, we would query push_delivery table for real-time aggregation
        // For MVP, we presume stats_ fields are updated by a worker or via callback
        return {
            sent: campaign.stats_sent,
            delivered: campaign.stats_delivered,
            opened: campaign.stats_opened,
            openRate: campaign.stats_sent > 0 ? (campaign.stats_opened / campaign.stats_sent) * 100 : 0,
        };
    }

    async sendNow(companyId: string, id: string) {
        const campaign = await this.repo.findOneBy({ id, company_id: companyId });
        if (!campaign) throw new NotFoundException('Campaign not found');

        if (campaign.status === CampaignStatus.SENT) return campaign;

        // 1. Resolve Audience
        // Mock query for users. In real app, inject UsersService
        const userIds = ['user-uuid-1', 'user-uuid-2']; // Placeholder

        // 2. Trigger Push
        const result = await this.comms.sendPush({
            companyId,
            userIds,
            title: campaign.title,
            body: campaign.message_body,
            imageUrl: campaign.image_url,
            kind: 'CAMPAIGN',
            entityId: campaign.id,
        });

        // 3. Update Status
        campaign.status = CampaignStatus.SENT;
        campaign.sent_at = new Date();
        campaign.stats_sent = result.success;
        campaign.stats_delivered = result.success; // Approximation

        return this.repo.save(campaign);
    }
}
