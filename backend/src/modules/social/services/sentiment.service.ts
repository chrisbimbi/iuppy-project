
import { Injectable } from '@nestjs/common';

export enum SentimentLabel {
    POSITIVE = 'POSITIVE',
    NEUTRAL = 'NEUTRAL',
    NEGATIVE = 'NEGATIVE'
}

export interface SentimentResult {
    score: number; // -1.0 to 1.0
    label: SentimentLabel;
    keywords: string[];
}

@Injectable()
export class SentimentService {

    /**
     * MOCK implementation of Sentiment Analysis.
     * In production, this would call OpenAI, VertexAI or use a local NLP library like `natural` or `sentiment`.
     */
    async analyze(text: string): Promise<SentimentResult> {
        // Simple heuristic for mock demo
        const lower = text.toLowerCase();

        let score = 0;
        if (lower.includes('ótimo') || lower.includes('excelente') || lower.includes('amo') || lower.includes('parabéns')) {
            score = 0.8;
        } else if (lower.includes('bom') || lower.includes('gostei')) {
            score = 0.4;
        } else if (lower.includes('ruim') || lower.includes('péssimo') || lower.includes('odeio') || lower.includes('problema')) {
            score = -0.6;
        } else if (lower.includes('triste') || lower.includes('chateado')) {
            score = -0.4;
        }

        // Add some noise/randomness for realism in demo
        score = Math.max(-1, Math.min(1, score + (Math.random() * 0.2 - 0.1)));

        let label = SentimentLabel.NEUTRAL;
        if (score > 0.3) label = SentimentLabel.POSITIVE;
        if (score < -0.3) label = SentimentLabel.NEGATIVE;

        return {
            score,
            label,
            keywords: this.extractKeywords(text)
        };
    }

    private extractKeywords(text: string): string[] {
        return text.split(' ').filter(w => w.length > 5).slice(0, 3);
    }
}
