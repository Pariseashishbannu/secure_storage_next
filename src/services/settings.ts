import api from '@/lib/api';

export interface UserProfile {
    id: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    storage_quota_gb: number;
    storage_used: number;
}

export const settingsService = {
    getProfile: async () => {
        const response = await api.get<UserProfile>('/users/profile/');
        return response.data;
    },
    updateProfile: async (data: Partial<UserProfile>) => {
        const response = await api.patch<UserProfile>('/users/profile/', data);
        return response.data;
    }
};
