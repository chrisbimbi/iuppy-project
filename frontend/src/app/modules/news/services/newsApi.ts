import axios from 'axios';
import { AudienceMode } from '@shared/types/NewsSettings';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export interface AudienceProbeRequest {
  mode: AudienceMode;
  spaceId?: string;
  channelIds?: string[];
  groupIds?: string[];
}

export interface AudienceProbeResponse {
  totalUsuarios: number;
  comTokenAtivo: number;
  mode: AudienceMode;
  identifiers: Record<string, any>;
}

export interface NewsStatistics {
  audiencia: {
    totalUsuarios: number;
    comTokenAtivo: number;
  };
  entregas: {
    totalEnviadas: number;
    totalEntregues: number;
  };
  aberturas: {
    total: number;
    unicas: number;
  };
  acks: {
    total: number;
    unicos: number;
  };
  interacoes: {
    reacoes: Record<string, number>;
    comentarios: number;
    compartilhamentos: number;
  };
  seriesDiarias: {
    data: string;
    opens: number;
    opensUnicos: number;
    acks: number;
    reacoes: number;
    comentarios: number;
    shares: number;
  }[];
}

export const newsApi = {
  async probeAudience(data: AudienceProbeRequest): Promise<AudienceProbeResponse> {
    const response = await axios.post(`${API_URL}/news/audience/probe`, data, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  },

  async publishNews(newsId: string): Promise<any> {
    const response = await axios.post(`${API_URL}/news/${newsId}/publish`, {}, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  },

  async resendToUnopened(newsId: string): Promise<any> {
    const response = await axios.post(`${API_URL}/news/${newsId}/resend`, {}, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  },

  async getStatistics(newsId: string): Promise<NewsStatistics> {
    const response = await axios.get(`${API_URL}/news/${newsId}/statistics`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  },

  async getUnopenedUsers(newsId: string): Promise<any[]> {
    const response = await axios.get(`${API_URL}/news/${newsId}/statistics/unopened`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  },
};

