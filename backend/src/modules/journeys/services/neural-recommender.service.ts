
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JourneyEntity } from '../entities/journey.entity';
import { UserEntity } from '../../../users/user.entity';

@Injectable()
export class NeuralRecommenderService {
    private readonly logger = new Logger(NeuralRecommenderService.name);

    constructor(
        @InjectRepository(JourneyEntity)
        private journeyRepo: Repository<JourneyEntity>,
    ) { }

    /**
     * MOCK Vector Similarity Search.
     * Real world: Generate embedding for User Profile -> Query pgvector on Journey Embeddings.
     */
    async recommendJourneys(userId: string): Promise<JourneyEntity[]> {
        this.logger.log(`Calculating neural recommendations for user ${userId}...`);

        // Mock Logic: Fetch 3 random active journeys
        // Simulating "high similarity" matches
        const allJourneys = await this.journeyRepo.find({
            take: 10,
            where: { active: true }
        });

        if (allJourneys.length === 0) return [];

        // Shuffle and pick top 3
        const shuffled = allJourneys.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 3);
    }

    /**
     * Returns the "embedding" vector for compliance audit (Mock)
     */
    async getUserEmbedding(userId: string): Promise<number[]> {
        // Mock 128-dim vector
        return Array(128).fill(0).map(() => Math.random());
    }
}
