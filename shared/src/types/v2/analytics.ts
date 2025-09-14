// v2 – Analytics

export type TimeRange = { from?: string; to?: string; tz?: string };

export type NewsAnalytics = {
  newsId: string;
  audience: { eligible: number; opened: number; uniqueOpened: number; acknowledged: number };
  reactions: Record<string, number>;
  comments: { total: number; pending: number; approved: number };
  shares: number;
  seriesDaily: Array<{ date: string; opens: number; uniqueOpens: number; acks: number }>;
  heatmap: Array<{ day: number; hour: number; opens: number }>; // 0..6, 0..23
};

export type NewsAnalyticsSummary = {
  posts: number;
  totalOpens: number;
  uniqueVisitors: number;
  acknowledgements: number;
  reactions: number;
  comments: number;
  shares: number;
};