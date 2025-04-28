import axios from 'axios';
import { News, CreateNewsDto, UpdateNewsDto } from '@shared/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const ContentService = {
  /** Lista conteúdos, opcionalmente filtrados por canal */
  async list(channelId?: string | null): Promise<News[]> {
    const response = await axios.get<News[]>(`${API_URL}/news`, {
      params: channelId ? { channelId } : {},
    });
    return response.data;
  },

  /** Obtém um único conteúdo por ID */
  async get(id: string): Promise<News> {
    const response = await axios.get<News>(`${API_URL}/news/${id}`);
    return response.data;
  },

  /** Cria um novo conteúdo */
  async create(dto: CreateNewsDto): Promise<News> {
    const response = await axios.post<News>(`${API_URL}/news`, dto);
    return response.data;
  },

  /** Atualiza um conteúdo existente */
  async update(id: string, dto: UpdateNewsDto): Promise<News> {
    const response = await axios.put<News>(`${API_URL}/news/${id}`, dto);
    return response.data;
  },

  /** Remove um conteúdo por ID */
  async remove(id: string): Promise<void> {
    await axios.delete(`${API_URL}/news/${id}`);
  },
};