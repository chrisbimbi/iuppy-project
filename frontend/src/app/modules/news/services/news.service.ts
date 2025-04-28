import axios from 'axios';
import { News, CreateNewsDto, UpdateNewsDto } from '@shared/types';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const ContentService = {
  // Lista conteúdos por canal
  async list(channelId: string | null): Promise<News[]> {
    const response = await axios.get<News[]>(`${API_URL}/news`, {
      params: channelId ? { channelId } : {},
    });
    return response.data;
  },

  async createNew(news: CreateNewsDto): Promise<News> {
    const response = await axios.post<News>(`${API_URL}/news`, news);
    return response.data;
  },

  async getNew(id: string): Promise<News> {
    const response = await axios.get<News>(`${API_URL}/news/${id}`);
    return response.data;
  },

  async updateNew(id: string, news: UpdateNewsDto): Promise<News> {
    const response = await axios.put<News>(`${API_URL}/news/${id}`, news);
    return response.data;
  },

  async deleteNew(id: string): Promise<void> {
    await axios.delete(`${API_URL}/news/${id}`);
  },
};
