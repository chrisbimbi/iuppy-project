// src/v2/analytics/latency.types.ts
export type LatencyCDFPoint = { x: number; y: number }; // x=minutos, y=%
export type LatencyHistogram = {
  buckets: { label: string; count: number }[];
  total: number;
};
export type LatencySummary = {
  p50: number | null;
  p90: number | null;
  p99: number | null;
  halfLifeMinutes: number | null;
  pctLeq5m: number;
  pctLeq15m: number;
  pctLeq60m: number;
  opened24h: number;
  opened: number;
  delivered: number;
};
