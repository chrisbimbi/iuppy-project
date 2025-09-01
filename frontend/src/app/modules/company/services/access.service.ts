// usa o client "api" que já injeta Authorization e faz refresh-on-401
import { api } from 'src/app/modules/auth/core/_requests'
import type { AccessGrant, UpsertAccessGrantDto, AccessCapabilities } from '@shared/types/Access'

export const AccessService = {
  async list(companyId: string, userId?: string): Promise<AccessGrant[]> {
    const res = await api.get(`/modules/${companyId}/access/grants`, { params: { userId } })
    return res.data
  },
  async upsert(companyId: string, dto: UpsertAccessGrantDto): Promise<AccessGrant> {
    const res = await api.post(`/modules/${companyId}/access/grants`, dto)
    return res.data
  },
  async remove(companyId: string, id: string): Promise<{ affected: number }> {
    const res = await api.delete(`/modules/${companyId}/access/grants/${id}`)
    return res.data
  },
  async capabilities(companyId: string): Promise<AccessCapabilities> {
    const res = await api.get(`/modules/${companyId}/access/capabilities`)
    return res.data
  },
}