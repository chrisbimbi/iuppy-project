import { api } from 'src/app/api';

export const Nr1ParticipationApi = {
    listSubmissions: (companyId: string, template: string) => {
        return api.get('/nr1/participation/submissions', { params: { companyId, template } }).then(r => r.data);
    },
    convertToRisk: (companyId: string, submissionId: string, riskData: any) => {
        return api.post('/nr1/participation/convert/risk', { companyId, submissionId, riskData }).then(r => r.data);
    },
    convertToAction: (companyId: string, submissionId: string, riskId: string, actionData: any) => {
        return api.post('/nr1/participation/convert/action', { companyId, submissionId, riskId, actionData }).then(r => r.data);
    }
};

export const Nr1RisksApi = {
    list: (companyId: string, filters?: any) => {
        return api.get('/nr1/risks', { params: { companyId, ...filters } }).then(r => r.data);
    },
    get: (id: string) => {
        return api.get(`/nr1/risks/${id}`).then(r => r.data);
    },
    create: (data: any) => {
        return api.post('/nr1/risks', data).then(r => r.data);
    },
    update: (id: string, data: any) => {
        return api.patch(`/nr1/risks/${id}`, data).then(r => r.data);
    },
    delete: (id: string) => {
        return api.delete(`/nr1/risks/${id}`).then(r => r.data);
    },
    // Mocking matrix calculation for now if backend doesn't have a dedicated endpoint yet, 
    // or we can just aggregate from list() in frontend.
};

export const Nr1ActionPlansApi = {
    list: (companyId: string, filters?: any) => {
        return api.get('/nr1/action-plans', { params: { companyId, ...filters } }).then(r => r.data);
    },
    get: (id: string) => {
        return api.get(`/nr1/action-plans/${id}`).then(r => r.data);
    },
    create: (data: any) => {
        return api.post('/nr1/action-plans', data).then(r => r.data);
    },
    update: (id: string, data: any) => {
        return api.patch(`/nr1/action-plans/${id}`, data).then(r => r.data);
    },
    delete: (id: string) => {
        return api.delete(`/nr1/action-plans/${id}`).then(r => r.data);
    }
};
