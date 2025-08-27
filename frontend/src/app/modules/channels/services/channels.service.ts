// src/app/modules/channels/services/channels.service.ts
import { Channel } from '@shared/types/Channel'
import { api } from 'src/app/modules/auth/core/_requests'

export const ChannelsService = {
  async list(companyId: string, spaceId?: string): Promise<Channel[]> {
    const { data } = await api.get<Channel[]>('/channels', {
      params: { companyId, spaceId },
    })
    return data
  },

  async createChannel(channel: Partial<Channel>): Promise<Channel> {
    const { data } = await api.post<Channel>('/channels', channel)
    return data
  },

  async updateChannel(id: string, channel: Partial<Channel>): Promise<Channel> {
    const { data } = await api.put<Channel>(`/channels/${id}`, channel)
    return data
  },

  async deleteChannel(id: string): Promise<void> {
    await api.delete(`/channels/${id}`)
  },

  async reorderChannels(companyId: string, channelIds: string[]): Promise<void> {
    await api.post('/channels/order', { companyId, channelIds })
  },
}