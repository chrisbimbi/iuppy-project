import axios from 'axios';
import { User } from '@shared/types';
const API = import.meta.env.VITE_API_URL||'http://localhost:3000';

export const UsersService = {
  async list(companyId: string): Promise<User[]> {
    const r = await axios.get<User[]>(`${API}/users`,{params:{companyId}});
    return r.data;
  },
};