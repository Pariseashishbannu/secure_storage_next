import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const api: AxiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    // In Next.js client components, we can access localStorage
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            if (typeof window !== 'undefined') {
                const refreshToken = localStorage.getItem('refresh_token');
                if (refreshToken) {
                    try {
                        const resp = await axios.post(`${API_URL}/auth/token/refresh/`, { refresh: refreshToken });
                        if (resp.status === 200) {
                            localStorage.setItem('access_token', resp.data.access);
                            api.defaults.headers.common['Authorization'] = `Bearer ${resp.data.access}`;
                            originalRequest.headers['Authorization'] = `Bearer ${resp.data.access}`;
                            return api(originalRequest);
                        }
                    } catch (refreshError) {
                        console.error("Token refresh failed", refreshError);
                        localStorage.removeItem('access_token');
                        localStorage.removeItem('refresh_token');
                        window.location.href = '/login';
                    }
                } else {
                    localStorage.removeItem('access_token');
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

// ... (previous code)

export const storage = {
    // Stats endpoint
    getStats: () => api.get('/files/stats/'),

    // Updated endpoints to match apps.files.urls
    getFiles: (type?: string, folder?: string, favorite?: boolean, category?: string) => api.get('/files/', {
        params: { type, folder, favorite, category }
    }),
    createFolder: (name: string, parent?: string) => api.post('/files/', {
        name,
        is_folder: true,
        parent
    }),
    uploadFile: (formData: FormData) => api.post('/files/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),

    // Chunked Upload API
    initChunkedUpload: (filename: string, fileSize: number, mimeType: string) => api.post('/files/upload/init/', {
        filename, file_size: fileSize, mime_type: mimeType
    }),
    uploadChunk: (uploadId: string, chunk: Blob, chunkIndex: number) => {
        const formData = new FormData();
        formData.append('file', chunk);
        formData.append('chunk_index', chunkIndex.toString());
        return api.post(`/files/upload/chunk/${uploadId}/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    completeChunkedUpload: (uploadId: string, parentId?: string, metadata?: Record<string, unknown>) => api.post(`/files/upload/complete/${uploadId}/`, {
        parent_id: parentId,
        metadata: metadata
    }),

    getDownloadUrl: (fileId: string) => `${API_URL}/files/${fileId}/download/`,
    deleteFile: (fileId: string) => api.delete(`/files/${fileId}/`),
    updateFile: (fileId: string, data: Record<string, unknown>) => api.patch(`/files/${fileId}/`, data),
    getStorageStats: () => api.get('/files/storage/stats/')
};

export const audit = {
    // Audit logs endpoint
    getLogs: () => api.get('/audit/')
};

export const secrets = {
    getAll: () => api.get('/secrets/'),
    getById: (id: string) => api.get(`/secrets/${id}/`),
    create: (data: Record<string, unknown>) => api.post('/secrets/', data),
    update: (id: string, data: Record<string, unknown>) => api.patch(`/secrets/${id}/`, data),
    delete: (id: string) => api.delete(`/secrets/${id}/`)
};

export default api;
