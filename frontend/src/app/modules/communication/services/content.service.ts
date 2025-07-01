import axios from 'axios';
import { News, CreateNewsDto, UpdateNewsDto } from '@shared/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const ContentService = {
  async list(channelId?: string | null): Promise<News[]> {
    const response = await axios.get<News[]>(`${API_URL}/news`, {
      params: channelId ? { channelId } : {},
    });
    return response.data;
  },

  async get(id: string): Promise<News> {
    const response = await axios.get<News>(`${API_URL}/news/${id}`);
    return response.data;
  },

  async create(dto: CreateNewsDto): Promise<News> {
    const response = await axios.post<News>(`${API_URL}/news`, dto);
    return response.data;
  },

  async update(id: string, dto: UpdateNewsDto): Promise<News> {
    const response = await axios.put<News>(`${API_URL}/news/${id}`, dto);
    return response.data;
  },

  async remove(id: string): Promise<void> {
    await axios.delete(`${API_URL}/news/${id}`);
  },
/**
   * Retorna quantos posts existem naquele canal (usa o `list` por enquanto)
   */
  async countByChannel(channelId: string): Promise<number> {
    const items = await this.list(channelId)
    return items.length
  },

  /**
   * Busca o último post publicado no canal (por data de publicação)
   */
  async getLatestByChannel(channelId: string): Promise<News | null> {
    const items = await this.list(channelId)
    if (items.length === 0) return null
    // supõe que `publishedAt` exista em News e seja um ISO string
    items.sort(
      (a, b) =>
        new Date(b.createdAt!).getTime() -
        new Date(a.createdAt!).getTime()
    )
    return items[0]
  },
}