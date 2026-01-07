
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { GamificationService } from '../src/modules/gamification/gamification.service';
import { GamificationActionType } from '../src/modules/gamification/entities/user-xp-history.entity';
import { Logger } from '@nestjs/common';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const gamificationService = app.get(GamificationService);
    const logger = new Logger('ManualAwardScript');

    const userId = '6bba78b5-3bf9-405a-a1be-c98eef4c4192'; // Developer Test
    const amount = 500;

    logger.log(`Awarding ${amount} XP to user ${userId}...`);

    try {
        const result = await gamificationService.awardXP(
            userId,
            amount,
            GamificationActionType.MANUAL_AWARD,
            'script-test',
            'Test Script Validation',
            { type: 'test' }
        );

        logger.log('--- RESULT ---');
        logger.log(`Old Level: (implicit)`);
        logger.log(`Points Given: ${result?.amount}`);
        logger.log(`New Total XP: ${result?.newUsageXP}`);
        logger.log(`New Level: ${result?.newLevel}`);
        logger.log(`Leveled Up?: ${result?.leveledUp}`);
        logger.log('--------------');

    } catch (e) {
        logger.error('Failed to award XP', e);
    } finally {
        await app.close();
    }
}

bootstrap();
