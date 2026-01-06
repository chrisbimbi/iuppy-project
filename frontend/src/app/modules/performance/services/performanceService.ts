import axios from 'axios'
import { PerformanceCycle, Goal, AssessmentForm } from '@shared/types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const createCycle = async (cycle: Partial<PerformanceCycle>) => {
    const response = await axios.post(`${API_URL}/performance/cycles`, cycle)
    return response.data
}

export const getCalibrationData = async (userId: string, cycleId: string) => {
    const response = await axios.get(`${API_URL}/performance/9box?userId=${userId}&cycleId=${cycleId}`)
    return response.data
}

export const calibrateUser = async (data: { userId: string, cycleId: string, newQuadrant: string, justification: string }) => {
    const response = await axios.post(`${API_URL}/performance/calibration`, data)
    return response.data
}

// Analytics
export const get9BoxDistribution = async () => {
    const response = await axios.get(`${API_URL}/performance/analytics/9box-distribution`)
    return response.data
}

export const getCompetenciesRadar = async () => {
    const response = await axios.get(`${API_URL}/performance/analytics/competencies-radar`)
    return response.data
}
