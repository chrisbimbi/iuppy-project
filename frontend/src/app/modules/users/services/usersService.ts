import axios from 'axios'
import { User } from '@shared/types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export async function getUsers(): Promise<User[]> {
    const response = await axios.get(`${API_URL}/users`)
    return response.data
}

export async function importUsers(file: File, syncKey: string) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('syncKey', syncKey)

    const response = await axios.post(`${API_URL}/users/import`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })
    return response.data
}

export async function createUser(user: Partial<User>) {
    const response = await axios.post(`${API_URL}/users`, user)
    return response.data
}

export async function updateUser(id: string, user: Partial<User>) {
    const response = await axios.patch(`${API_URL}/users/${id}`, user)
    return response.data
}

export function deleteUser(id: string) {
    return axios.delete(`${API_URL}/users/${id}`).then((response) => response.data)
}

export function getUserAnalytics() {
    return axios.get(`${API_URL}/v2/analytics/users/overview`).then((response) => response.data)
}
