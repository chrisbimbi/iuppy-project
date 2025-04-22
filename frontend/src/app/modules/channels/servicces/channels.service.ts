
import axios from 'axios';
import { Channel } from '@shared/types/Channel';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/';

export const ChannelsService = {
  async getChannels(): Promise<Channel[]> {
    console.log('Fetching channels from API...' + API_URL);
    const response = await axios.get(`${API_URL}/channels`);
    return response.data;
  },
  // Você pode adicionar métodos para criar, atualizar ou deletar canais:
  async createChannel(channel: Partial<Channel>): Promise<Channel> {
    const response = await axios.post(`${API_URL}/channels`, channel);
    return response.data;
  },
  async updateChannel(id: string, channel: Partial<Channel>): Promise<Channel> {
    const response = await axios.put(`${API_URL}/channels/${id}`, channel);
    return response.data;
  },
  async deleteChannel(id: string): Promise<void> {
    await axios.delete(`${API_URL}/channels/${id}`);
  }
};