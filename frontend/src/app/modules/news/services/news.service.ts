import axios, { AxiosError } from 'axios';
import { News, CreateNewsDto, UpdateNewsDto } from '@shared/types';
import { ErrorResponse } from 'react-router-dom';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export const NewsService = {
    createNew: async (news: CreateNewsDto) => {
        try {
            const response = await axios.post(`${API_URL}/news`, news);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError<{ message: string | string[], error: string, statusCode: number }>;
                console.error('Erro na chamada da API:', axiosError.response?.data);
                throw axiosError;
            }
            throw error;
        }
    },

    async getNews(): Promise<News[]> {
        const response = await axios.get(`${API_URL}/news`);
        return response.data;
    },
    async getNew(id: string): Promise<News> {
        const response = await axios.get<News>(`${API_URL}/news/${id}`);
        return response.data;
    },

    async updateNew(id: string, news: UpdateNewsDto): Promise<News> {
        const response = await axios.put<News>(`${API_URL}/news/${id}`, news);
        return response.data;
    },

    async deleteNew(id: string): Promise<void> {
        await axios.delete(`${API_URL}/news/${id}`);
    },
};