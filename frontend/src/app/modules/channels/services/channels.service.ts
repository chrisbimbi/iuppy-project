import axios, { AxiosError } from 'axios';
import { Channel } from '@shared/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const channelsService = {
  /**
   * Lista canais filtrando por empresa e, opcionalmente, por space e/ou group.
   */
  async list(companyId: string, spaceId?: string | null, groupId?: string | null): Promise<Channel[]> {
    try {
      const res = await axios.get<Channel[]>(`${API_URL}/channels`, {
        params: { companyId, spaceId, groupId },
      });
      return res.data;
    } catch (err) {
      const error = err as AxiosError<{ message: string | string[] }>;
      console.error('Erro ao buscar canais:', error.response?.data ?? error.message);
      throw error;
    }
  },

  /**
   * Cria um canal.
   */
  async create(payload: Partial<Channel>): Promise<Channel> {
    const res = await axios.post<Channel>(`${API_URL}/channels`, payload);
    return res.data;
  },

  /**
   * Atualiza um canal existente.
   */
  async update(id: string, payload: Partial<Channel>): Promise<Channel> {
    const res = await axios.put<Channel>(`${API_URL}/channels/${id}`, payload);
    return res.data;
  },
};
