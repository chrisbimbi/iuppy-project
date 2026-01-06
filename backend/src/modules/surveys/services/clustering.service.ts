
import { Injectable } from '@nestjs/common';

export interface ClusterResult {
    topic: string;
    count: number;
    sampleTexts: string[];
}

@Injectable()
export class ClusteringService {

    /**
     * MOCK implementation of Text Clustering.
     * Uses simple keyword matching to simulate topic grouping.
     */
    async clusterResponses(texts: string[]): Promise<ClusterResult[]> {
        const clusters: Record<string, string[]> = {
            'Salário & Benefícios': [],
            'Infraestrutura': [],
            'Gestão & Liderança': [],
            'Outros': []
        };

        for (const text of texts) {
            const lower = text.toLowerCase();
            if (lower.match(/(salário|benefício|vale|vr|plano)/)) {
                clusters['Salário & Benefícios'].push(text);
            } else if (lower.match(/(estrutura|computador|cadeira|internet|ar condicionado)/)) {
                clusters['Infraestrutura'].push(text);
            } else if (lower.match(/(chefe|gestor|líder|comunicação|feedback)/)) {
                clusters['Gestão & Liderança'].push(text);
            } else {
                clusters['Outros'].push(text);
            }
        }

        return Object.entries(clusters).map(([topic, samples]) => ({
            topic,
            count: samples.length,
            sampleTexts: samples.slice(0, 3) // Return top 3 examples
        })).filter(c => c.count > 0);
    }
}
