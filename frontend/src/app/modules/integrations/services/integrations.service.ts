
import { api } from '../../../api'

export interface IntegrationProvider {
    key: string;
    name: string;
    description: string;
    iconUrl: string;
    authType: string;
}

export interface IntegrationConnection {
    id: string;
    providerKey: string;
    status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
    lastSyncAt?: string;
}

export const IntegrationsService = {
    getProviders: async () => {
        const res = await api.get<IntegrationProvider[]>('/integrations/providers')
        return res.data
    },

    getConnections: async () => {
        const res = await api.get<IntegrationConnection[]>('/integrations/connections')
        return res.data
    },

    triggerSync: async (connectionId: string, type: 'FULL' | 'DELTA' = 'DELTA') => {
        const res = await api.post('/integrations/sync', { connectionId, type })
        return res.data
    }
}
