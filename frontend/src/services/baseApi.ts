// frontend/src/services/baseApi.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const baseApi = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// (Opcional) Interceptors de request/response para token, logs, erros globais, etc.
baseApi.interceptors.response.use(
    response => response,
    error => {
        // aqui você pode lidar com 401, 500, etc. de forma centralizada
        return Promise.reject(error);
    }
);

export default baseApi;
