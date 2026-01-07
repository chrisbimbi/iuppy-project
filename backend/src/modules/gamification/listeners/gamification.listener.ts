import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GamificationService } from '../gamification.service';
import { GamificationSettingsService } from '../gamification-settings.service';
import { GamificationActionType } from '../entities/user-xp-history.entity';

import { NewsEntity } from '../../../news/news.entity';
import { JourneyEntity } from '../../journeys/entities/journey.entity';
import { JourneyStepEntity } from '../../journeys/entities/journey-step.entity';
import { SurveyEntity } from '../../surveys/entities/survey.entity';

@Injectable()
export class GamificationListener {
    private readonly logger = new Logger(GamificationListener.name);

    constructor(
        private readonly gamificationService: GamificationService,
        private readonly settingsService: GamificationSettingsService,
        @InjectRepository(NewsEntity) private readonly newsRepo: Repository<NewsEntity>,
        @InjectRepository(JourneyStepEntity) private readonly stepRepo: Repository<JourneyStepEntity>,
        @InjectRepository(JourneyEntity) private readonly journeyRepo: Repository<JourneyEntity>,
        @InjectRepository(SurveyEntity) private readonly surveyRepo: Repository<SurveyEntity>,
    ) { }

    @OnEvent('journey.step_completed')
    async handleJourneyStep(payload: { userId: string, stepId: string, companyId: string }) {
        const { userId, stepId, companyId } = payload;
        const type = GamificationActionType.JOURNEY_STEP;

        // Idempotency
        if (await this.gamificationService.isAlreadyAwarded(userId, type, stepId)) return;

        // Lookup Override
        const step = await this.stepRepo.findOne({ where: { id: stepId }, select: ['xpOverride'] });

        // Resolve Config
        const { points, dailyLimit } = await this.settingsService.resolveConfig(companyId, type, step?.xpOverride);

        await this.gamificationService.awardXP(
            userId,
            points,
            type,
            stepId,
            'Completou um passo da jornada',
            null,
            dailyLimit
        );
    }

    @OnEvent('journey.completed')
    async handleJourneyCompleted(payload: { userId: string, journeyId: string, companyId: string }) {
        const { userId, journeyId, companyId } = payload;
        const type = GamificationActionType.JOURNEY_COMPLETION;

        if (await this.gamificationService.isAlreadyAwarded(userId, type, journeyId)) return;

        // Journey doesn't have override yet (only Step and News), so passthrough
        // Or if we added it to JourneyEntity, we would check it.
        // Assuming no override column added to JourneyEntity based on my tasks (I only added to Step and News).
        const { points, dailyLimit } = await this.settingsService.resolveConfig(companyId, type);

        await this.gamificationService.awardXP(
            userId,
            points,
            type,
            journeyId,
            'Concluiu uma jornada de aprendizado!',
            null,
            dailyLimit
        );
    }

    @OnEvent('news.read')
    async handleNewsRead(payload: { userId: string, newsId: string, companyId: string }) {
        const { userId, newsId, companyId } = payload;
        const type = GamificationActionType.NEWS_READ;

        if (await this.gamificationService.isAlreadyAwarded(userId, type, newsId)) return;

        const news = await this.newsRepo.findOne({ where: { id: newsId }, select: ['xpOverride'] });
        const { points, dailyLimit } = await this.settingsService.resolveConfig(companyId, type, news?.xpOverride);

        await this.gamificationService.awardXP(
            userId,
            points,
            type,
            newsId,
            'Leu um conteúdo',
            null,
            dailyLimit
        );
    }

    @OnEvent('survey.completed')
    async handleSurveyCompleted(payload: { userId: string, surveyId: string, companyId: string }) {
        const { userId, surveyId, companyId } = payload;
        const type = GamificationActionType.SURVEY_COMPLETION;

        if (await this.gamificationService.isAlreadyAwarded(userId, type, surveyId)) return;

        // Check override helper if Survey has it. Note: I didn't add xpOverride to SurveyEntity explicitly yet.
        // I will assume defaults for now. 
        const { points, dailyLimit } = await this.settingsService.resolveConfig(companyId, type);

        await this.gamificationService.awardXP(
            userId,
            points,
            type,
            surveyId,
            'Respondeu uma pesquisa',
            null,
            dailyLimit
        );
    }

    @OnEvent('news.reaction')
    async handleNewsReaction(payload: { userId: string, newsId: string, companyId: string, reaction: string }) {
        const { userId, newsId, companyId } = payload;
        const type = GamificationActionType.NEWS_REACTION;

        if (await this.gamificationService.isAlreadyAwarded(userId, type, newsId)) return;

        // Reaction points standard.
        const { points, dailyLimit } = await this.settingsService.resolveConfig(companyId, type);

        await this.gamificationService.awardXP(
            userId,
            points,
            type,
            newsId,
            'Reagiu a um conteúdo',
            { reaction: payload.reaction },
            dailyLimit
        );
    }

    @OnEvent('news.comment')
    async handleNewsComment(payload: { userId: string, newsId: string, commentId: string, companyId: string }) {
        const { userId, newsId, commentId, companyId } = payload;
        const type = GamificationActionType.NEWS_COMMENT;

        // Unique by CommentId
        const { points, dailyLimit } = await this.settingsService.resolveConfig(companyId, type);

        await this.gamificationService.awardXP(
            userId,
            points,
            type,
            commentId,
            'Comentou em um conteúdo',
            { newsId },
            dailyLimit
        );
    }

    @OnEvent('post.comment')
    async handlePostComment(payload: { userId: string, postId: string, commentId: string, companyId: string }) {
        const { userId, postId, commentId, companyId } = payload;
        const type = GamificationActionType.SOCIAL_COMMENT;

        // Use commentId as unique identifier
        const { points, dailyLimit } = await this.settingsService.resolveConfig(companyId, type);

        await this.gamificationService.awardXP(
            userId,
            points,
            type,
            commentId,
            'Comentou em um post',
            { postId },
            dailyLimit
        );
    }

    @OnEvent('post.reaction')
    async handlePostReaction(payload: { userId: string, postId: string, reaction: string, companyId: string }) {
        const { userId, postId, companyId } = payload;
        const type = GamificationActionType.SOCIAL_REACTION;

        if (await this.gamificationService.isAlreadyAwarded(userId, type, postId)) return;

        const { points, dailyLimit } = await this.settingsService.resolveConfig(companyId, type);

        await this.gamificationService.awardXP(
            userId,
            points,
            type,
            postId,
            'Reagiu a um post',
            { reaction: payload.reaction },
            dailyLimit
        );
    }

    @OnEvent('news.share')
    async handleNewsShare(payload: { userId: string, newsId: string, shareId: string, companyId: string }) {
        const { userId, newsId, shareId, companyId } = payload;
        const type = GamificationActionType.NEWS_SHARE;

        // Use shareId as unique identifier
        const { points, dailyLimit } = await this.settingsService.resolveConfig(companyId, type);

        await this.gamificationService.awardXP(
            userId,
            points,
            type,
            shareId,
            'Compartilhou um conteúdo',
            { newsId },
            dailyLimit
        );
    }

    @OnEvent('post.create')
    async handlePostCreate(payload: { userId: string, postId: string, companyId: string }) {
        const { userId, postId, companyId } = payload;
        const type = GamificationActionType.SOCIAL_POST;

        // Use postId as unique identifier (user can only get points once per post they create)
        const { points, dailyLimit } = await this.settingsService.resolveConfig(companyId, type);

        await this.gamificationService.awardXP(
            userId,
            points,
            type,
            postId,
            'Criou um post',
            null,
            dailyLimit
        );
    }

    @OnEvent('post.share')
    async handlePostShare(payload: { userId: string, postId: string, shareId: string, companyId: string }) {
        const { userId, postId, shareId, companyId } = payload;
        const type = GamificationActionType.SOCIAL_SHARE;

        // Use shareId as unique identifier
        const { points, dailyLimit } = await this.settingsService.resolveConfig(companyId, type);

        await this.gamificationService.awardXP(
            userId,
            points,
            type,
            shareId,
            'Compartilhou um post',
            { postId },
            dailyLimit
        );
    }
}
