import axios from 'axios';

const api = axios.create({
    baseURL: 'https://apiibn.cristhiansancore.com.br',
});

// Interceptor para adicionar o Token JWT em todas as chamadas
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interceptor de resposta: faz logout automático quando o token expirar (401)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expirado ou inválido → limpa e redireciona para login
            localStorage.removeItem('token');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

export const membersApi = {
    list: () => api.get('/admin/members').then(res => res.data),
    create: (data: any) => api.post('/admin/members', data).then(res => res.data),
    update: (id: number, data: any) => api.put(`/admin/members/${id}`, data).then(res => res.data),
    delete: (id: number) => api.delete(`/admin/members/${id}`).then(res => res.data),
};

export const authApi = {
    login: (formData: FormData) => api.post('/public/login', formData).then(res => res.data),
};

export default api;
