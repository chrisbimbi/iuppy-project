import axios from 'axios';
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');

export const UploadsService = {
    async uploadLogo(file: File): Promise<string> {
        const form = new FormData();
        form.append('file', file);
        const { data } = await axios.post(`${API_URL}/uploads/logo`, form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data.url as string;
    },
};