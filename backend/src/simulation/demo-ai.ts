
import { FlightRiskService } from '../modules/performance/services/flight-risk.service';
import { SentimentService } from '../modules/social/services/sentiment.service';
import { SmartCalendarService } from '../modules/vacations/services/smart-calendar.service';
import { LlmToolsService } from '../modules/performance/services/llm-tools.service';
import { Logger } from '@nestjs/common';

/**
 * STANDALONE SIMULATION SCRIPT
 * Run with ts-node or similar to verify AI logic outputs.
 */
async function runSimulation() {
    const logger = new Logger('AISimulation');
    logger.log('--- STARTING FINAL AI CLUSTER SIMULATION ---');

    // 1. Flight Risk
    logger.log('\n[1] Testing FlightRiskModel...');
    const flightRiskService = new FlightRiskService(); // Mock instantiation
    const risk = await flightRiskService.predictTurnoverRisk('user-123');
    logger.log(`>> Prediction for User 123: Score=${risk.riskScore}, Level=${risk.riskLevel}`);

    // 2. Sentiment Analysis
    logger.log('\n[2] Testing SentimentService...');
    const sentimentService = new SentimentService();
    const resultPositive = await sentimentService.analyze('Eu amo trabalhar nesta empresa, é excelente!');
    const resultNegative = await sentimentService.analyze('Estou triste e odeio meu chefe.');
    logger.log(`>> "Eu amo...": Score=${resultPositive.score.toFixed(2)} (${resultPositive.label})`);
    logger.log(`>> "Estou triste...": Score=${resultNegative.score.toFixed(2)} (${resultNegative.label})`);

    // 3. LLM Tools
    logger.log('\n[3] Testing LlmToolsService (Feedback Rewrite)...');
    const llmService = new LlmToolsService();
    const originalFeedback = "Seu trabalho está péssimo e ruim.";
    const rewritten = await llmService.rewriteFeedback(originalFeedback);
    logger.log(`>> Original: "${originalFeedback}"`);
    logger.log(`>> Rewritten: "${rewritten}"`);

    logger.log('\n--- SIMULATION COMPLETE ---');
}

runSimulation();
