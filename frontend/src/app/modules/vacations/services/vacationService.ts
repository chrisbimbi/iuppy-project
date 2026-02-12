import axios from 'axios'
import { VacationPolicy, VacationRequest } from '@shared/types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const createPolicy = async (policy: Partial<VacationPolicy>) => {
    const response = await axios.post(`${API_URL}/vacations/policy`, policy)
    return response.data
}

export const createCollectiveVacation = async (data: any) => {
    const response = await axios.post(`${API_URL}/vacations/collective`, data);
    return response.data;
};

export const getRequests = async (companyId: string) => {
    const response = await axios.get<VacationRequest[]>(`${API_URL}/vacations/requests?companyId=${companyId}`)
    return response.data
}

// Analytics
export const getLiability = async () => {
    const response = await axios.get(`${API_URL}/vacations/analytics/liability`)
    return response.data
}

export const getHeatmap = async () => {
    const response = await axios.get(`${API_URL}/vacations/analytics/heatmap`)
    return response.data
}

export const approveRequest = async (requestId: string, approverId: string) => {
    const response = await axios.patch(`${API_URL}/vacations/requests/${requestId}/approve`, { approverId })
    return response.data
}

export const rejectRequest = async (requestId: string, approverId: string, reason: string) => {
    const response = await axios.patch(`${API_URL}/vacations/requests/${requestId}/reject`, { approverId, reason })
    return response.data
}
