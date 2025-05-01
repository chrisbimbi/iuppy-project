export interface Space {
  id: string;
  companyId: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  priority: number;
  active: boolean;

  /** Staffbase: canais de distribuição */
  distributionChannels: ('app' | 'email')[];

  /** Staffbase: grupos usuários que veem este espaço */
  targetGroupIds?: string[];

  /** Staffbase: administradores do espaço */
  adminIds?: string[];

  /** ← mudou de string para Date */
  createdAt: Date;
  updatedAt: Date;
}