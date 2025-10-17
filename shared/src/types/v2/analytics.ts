import { ReactionKind } from './interactions';

export interface TimeBin { hour: number; dow: number; count: number; } // 0..23, 0..6

export interface NewsMetricsDetailDTO {
  newsId: string;
  recebivel: number;            // snapshot audience at publish
  recebeuPush: number;          // push_delivery rows
  totalOpens: number;
  uniqueOpens: number;
  acks: number;
  reactionsByType: Record<ReactionKind, number>;
  comments: { total: number; pending: number; approved: number; rejected: number };
  shares: number;
  opens24hAposPushPct: number;  // % dos recebidores de push que abriram em 24h
  lagToFirstOpen: { avgSec: number; p50Sec: number; p95Sec: number };

  seriesDaily: Array<{
    date: string; // YYYY-MM-DD
    opens: number; uniqueOpens: number; acks: number; reactions: number; comments: number; shares: number;
  }>;

  heatmap: TimeBin[];
}

export interface NewsOverviewBreakdown {
  id: string; name: string;
  posts: number;
  alcancePct: number; // recebivel/totalCompany
  abriuPct: number;   // uniqueOpens/recebivel
  ackPct: number;     // acks/recebivel
}

export interface NewsOverviewDTO {
  period: { from: string; to: string };
  posts: number;
  opens: number; uniqueOpens: number; acks: number; reactions: number; comments: number; shares: number;
  postsComInteracaoPct: number;
  heatmap: TimeBin[];
  topPosts: Array<{ id: string; title: string; score: number }>;
  bySpace: NewsOverviewBreakdown[];
  byChannel: NewsOverviewBreakdown[];
  byGroup: NewsOverviewBreakdown[];
}

export interface UsersOverviewDTO {
  period: { from: string; to: string };
  totalColaboradores: number;
  registradosApp: number;
  ativosPeriodo: number;     // qualquer evento (inclui app_open)
  engajadosPeriodo: number;  // interações (ack/react/comment/share/survey)
  funnelPct: { registrados: number; ativos: number; engajados: number };
  heatmapAppOpen: TimeBin[];
  topInteractions: Array<{ type: string; count: number }>;
}

export interface SearchOverviewDTO {
  period: { from: string; to: string };
  totalQueries: number;
  uniqueUsers: number;
  topQueries: Array<{ hash: string; sample?: string; count: number; uniqueUsers: number }>;
}