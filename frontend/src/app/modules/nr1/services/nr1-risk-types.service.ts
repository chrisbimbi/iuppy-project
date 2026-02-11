import { api } from 'src/app/api';

export interface Nr1RiskType {
    id: string;
    companyId: string;
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export const Nr1RiskTypesService = {
    getAll: async () => {
        const { data } = await api.get<Nr1RiskType[]>('/nr1/risk-types');
        return data;
    },
    create: async (payload: Partial<Nr1RiskType>) => {
        const { data } = await api.post<Nr1RiskType>('/nr1/risk-types', payload);
        return data;
    },
    update: async (id: string, payload: Partial<Nr1RiskType>) => {
        const { data } = await api.put<Nr1RiskType>(`/nr1/risk-types/${id}`, payload);
        return data;
    },
    delete: async (id: string) => {
        await api.delete(`/nr1/risk-types/${id}`);
    },
};
