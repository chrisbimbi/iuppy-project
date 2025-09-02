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

  async remove(companyId: string, id: string): Promise<{ affected?: number; id?: string }> {
    const res = await api.delete(`/modules/${companyId}/access/grants/${id}`)
    return res.data
  },

  // 🔧 resiliente a variações de rota no backend
  async capabilities(companyId: string): Promise<AccessCapabilities> {
    const candidates = [
      `/modules/${companyId}/access/capabilities`, // variação
      `/modules/${companyId}/access/capabilities`,    // ME inferido pelo JWT
      `/modules/${companyId}/access/me`,              // legado
    ]

    let last404: any = null
    for (const path of candidates) {
      try {
        const res = await api.get(path)
        return res.data
      } catch (err: any) {
        const status = err?.response?.status
        if (status === 404) { last404 = err; continue }
        throw err // outros erros (401/500) devem emergir
      }
    }
    // se todas as variações retornaram 404, propaga o último 404
    throw last404 ?? new Error('Capabilities endpoint not found')
  },
}