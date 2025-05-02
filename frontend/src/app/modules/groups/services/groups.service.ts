import axios from 'axios';
import { UserGroup, CreateGroupDto, UpdateGroupDto, User } from '@shared/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const GroupsService = {
  async list(companyId: string): Promise<UserGroup[]> {
    const resp = await axios.get<UserGroup[]>(`${API_URL}/groups`, { params: { companyId } });
    return resp.data;
  },
  async get(id: string): Promise<UserGroup> {
    const r = await axios.get<UserGroup>(`${API_URL}/groups/${id}`);
    return r.data;
  },
  async create(dto: CreateGroupDto): Promise<UserGroup> {
    const r = await axios.post<UserGroup>(`${API_URL}/groups`, dto);
    return r.data;
  },
  async update(id: string, dto: UpdateGroupDto): Promise<UserGroup> {
    const r = await axios.put<UserGroup>(`${API_URL}/groups/${id}`, dto);
    return r.data;
  },
  async remove(id: string): Promise<void> {
    await axios.delete(`${API_URL}/groups/${id}`);
  },

  // ↴ métodos novos
  async listMembers(groupId: string): Promise<User[]> {
    const r = await axios.get<User[]>(`${API_URL}/groups/${groupId}/members`);
    return r.data;
  },
  async addMember(groupId: string, userId: string): Promise<void> {
    await axios.post(`${API_URL}/groups/${groupId}/members`, { userId });
  },
  async removeMember(groupId: string, userId: string): Promise<void> {
    await axios.delete(`${API_URL}/groups/${groupId}/members/${userId}`);
  },
};