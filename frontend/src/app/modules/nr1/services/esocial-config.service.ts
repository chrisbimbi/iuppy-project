import { api } from 'src/app/api';

export interface EsocialConfig {
    id: string;
    companyId: string;
    enabled: boolean;
    environment: 'homologacao' | 'producao';
    certificateData: string | null;
    certificatePassword: string | null;
    certificateExpiry: Date | null;
    medicoNome: string | null;
    medicoCpf: string | null;
    medicoCrm: string | null;
    medicoUf: string | null;
    engenheiroNome: string | null;
    engenheiroCpf: string | null;
    engenheiroCrea: string | null;
    engenheiroUf: string | null;
    configured: boolean;
    connectionTested: boolean;
    lastTestedAt: Date | null;
}

export interface UpdateEsocialConfigDto {
    environment?: 'homologacao' | 'producao';
    medicoNome?: string;
    medicoCpf?: string;
    medicoCrm?: string;
    medicoUf?: string;
    engenheiroNome?: string;
    engenheiroCpf?: string;
    engenheiroCrea?: string;
    engenheiroUf?: string;
}

export const EsocialConfigService = {
    getConfig: (): Promise<EsocialConfig> =>
        api.get('/nr1/esocial/config').then(r => r.data),

    updateConfig: (data: UpdateEsocialConfigDto): Promise<EsocialConfig> =>
        api.put('/nr1/esocial/config', data).then(r => r.data),

    uploadCertificate: (file: File, password: string): Promise<{ success: boolean; expiryDate?: Date; message: string }> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('password', password);
        return api.post('/nr1/esocial/config/certificate', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }).then(r => r.data);
    },

    testConnection: (): Promise<{ success: boolean; message: string }> =>
        api.post('/nr1/esocial/config/test').then(r => r.data),

    toggleEnabled: (enabled: boolean): Promise<EsocialConfig> =>
        api.patch('/nr1/esocial/config/toggle', { enabled }).then(r => r.data),

    getStatus: (): Promise<{ isConfigured: boolean; enabled: boolean; environment: string; connectionTested: boolean; certificateExpiry: Date | null }> =>
        api.get('/nr1/esocial/config/status').then(r => r.data),
};
