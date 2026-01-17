import api from '@/lib/api';

export interface SocialLoginRequest {
    token: string;
    provider: 'google' | 'apple';
}

export const authService = {
    socialLogin: async (data: SocialLoginRequest) => {
        const response = await api.post('/users/social/', data);
        return response.data;
    }
};
