// frontend/src/services/spacesService.ts
import { Space, User } from '@shared/types';
import baseApi from 'src/services/baseApi';
import axios, { AxiosError, isAxiosError } from 'axios'

function handleAxiosError(error: unknown, defaultMsg: string): never {
  // Usamos o type-guard isAxiosError do próprio axios
  if (isAxiosError(error)) {
    // erro agora tipado como AxiosError<{ message?: string | string[] }>
    const msg = error.response?.data?.message
    throw new Error(Array.isArray(msg) ? msg.join(', ') : msg || defaultMsg)
  }
  // em qualquer outro caso, relança
  throw error instanceof Error ? error : new Error(defaultMsg)
}

export const spacesService = {
  async list(companyId: string): Promise<Space[]> {
    try {
      const { data } = await baseApi.get<Space[]>('/spaces', { params: { companyId } });
      return data;
    } catch (err) {
      handleAxiosError(err, 'Erro ao buscar spaces');
    }
  },

  async get(id: string): Promise<Space> {
    try {
      const { data } = await baseApi.get<Space>(`/spaces/${id}`);
      return data;
    } catch (err) {
      handleAxiosError(err, 'Erro ao buscar o space');
    }
  },

  async create(payload: Partial<Space>): Promise<Space> {
    try {
      const { data } = await baseApi.post<Space>('/spaces', payload);
      return data;
    } catch (err) {
      handleAxiosError(err, 'Erro ao criar o space');
    }
  },

  async update(id: string, payload: Partial<Space>): Promise<Space> {
    try {
      const { data } = await baseApi.patch<Space>(`/spaces/${id}`, payload);
      return data;
    } catch (err) {
      handleAxiosError(err, 'Erro ao atualizar o space');
    }
  },

  async remove(id: string): Promise<void> {
    try {
      await baseApi.delete(`/spaces/${id}`);
    } catch (err) {
      handleAxiosError(err, 'Erro ao remover o space');
    }
  },
 /**
   * Busca vários espaços pelo ID (faz N requests em paralelo)
   */
  async getByIds(ids: string[]): Promise<Space[]> {
    const calls = ids.map(id => this.get(id))
    return Promise.all(calls)
  },

  /**
   * Lista todos os usuários que pertencem a esses espaços.
   * Pede ao backend via: GET /spaces/{spaceId}/users
   */
  async listUsers(spaceIds: string[]): Promise<User[]> {
    const calls = spaceIds.map(id =>
      baseApi
        .get<User[]>(`/spaces/${id}/users`)
        .then(resp => resp.data)
        .catch(() => [])    // se um space não tiver rota, retorna vazio
    )
    const results = await Promise.all(calls)
    // "flatten"
    return results.reduce<User[]>((all, arr) => all.concat(arr), [])
  },
}
