import { QuestionStatisticsDto } from './question-statistics.dto';

export interface SurveyStatisticsDto {
  surveyId: string;
  totalResponses: number;

  // KPIs gerais
  anonymousRate?: number;
  completionRate?: number;
  windowFrom?: string;
  windowTo?: string;

  // série temporal
  responsesOverTime?: { date: string; count: number }[];

  // heatmap dia x hora
  responsesHeatmap?: { day: number; hour: number; count: number }[];

  // agregados
  npsOverall?: {
    npsScore: number;
    promoters: number;
    passives: number;
    detractors: number;
  };
  starsAverage?: number;
  scaleAverage?: number;

  // por pergunta
  questions: QuestionStatisticsDto[];
}
