export interface MockData {
    collaboratorsSummary: {
      active: number;
      total: number;
      inactive: number;
      monthlyTrend: number[];
    };
    contentEngagement: Array<{
      title: string;
      type: string;
      views: number;
    }>;
    openPositions: Array<{
      position: string;
      department: string;
      responsible: string;
      candidates: number;
      status: string;
    }>;
    hiringVsFiring: {
      hiring: number[];
      firing: number[];
      months: string[];
    };
    turnoverRate: {
      current: number;
      previous: number;
      reasons: Array<{
        reason: string;
        percentage: number;
      }>;
    };
    faqTopics: Array<{
      question: string;
      topic: string;
      occurrences: number;
    }>;
    pendingVacations: Array<{
      name: string;
      department: string;
      dueDate: string;
      recommendedStartDate: string;
    }>;
    multimediaContent: Array<{
      title: string;
      type: string;
      views: number;
    }>;
    latestSurveyResults: {
      question: string;
      responses: Array<{
        option: string;
        percentage: number;
      }>;
    };
  }