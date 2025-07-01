import axios from 'axios';
import { Channel } from '@shared/types/Channel';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/';

export const ChannelsService = {
  async list(companyId: string, spaceId?: string): Promise<Channel[]> {
    const { data } = await axios.get<Channel[]>(`${API_URL}/channels`, {
      params: { companyId, spaceId },
    });
    return data;
  },

  async createChannel(channel: Partial<Channel>): Promise<Channel> {
    const { data } = await axios.post<Channel>(`${API_URL}/channels`, channel);
    return data;
  },

  async updateChannel(id: string, channel: Partial<Channel>): Promise<Channel> {
    const { data } = await axios.put<Channel>(`${API_URL}/channels/${id}`, channel);
    return data;
  },

  async deleteChannel(id: string): Promise<void> {
    await axios.delete(`${API_URL}/channels/${id}`);
  },

  /** Chama o novo endpoint de reorder */
  async reorderChannels(
    companyId: string,
    channelIds: string[],
  ): Promise<void> {
    await axios.post(`${API_URL}/channels/order`, { companyId, channelIds });
  },
};