import { ModuleAccessGrant, UserModuleCapabilities } from '@shared/types/AccessControl'
import axios from 'axios'

const API = import.meta.env.VITE_APP_API_URL || 'http://localhost:4000'

export const AccessControlService = {
    async listGrants(companyId: string, userId?: string): Promise<ModuleAccessGrant[]> {
        const url = `${API}/modules/${companyId}/access/grants${userId ? `?userId=${userId}` : ''}`
        const { data } = await axios.get(url, { withCredentials: true })
        return data
    },

    async upsertGrant(payload: {
        companyId: string
        userId: string
        moduleKey: string
        scope: 'all' | 'space'
        spaceId?: string
        actions: Array<'view' | 'edit'>
    }): Promise<ModuleAccessGrant> {
        const url = `${API}/modules/${payload.companyId}/access/grants`
        const { data } = await axios.post(url, payload, { withCredentials: true })
        return data
    },

    async deleteGrant(companyId: string, id: string) {
        const url = `${API}/modules/${companyId}/access/grants/${id}`
        const { data } = await axios.delete(url, { withCredentials: true })
        return data
    },

    async myCapabilities(companyId: string): Promise<UserModuleCapabilities> {
        const url = `${API}/modules/${companyId}/access/me/capabilities`
        const { data } = await axios.get(url, { withCredentials: true })
        return data
    },
}