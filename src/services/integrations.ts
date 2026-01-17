import api from '@/lib/api';

export interface ICloudLoginRequest {
    apple_id: string;
    password: string;
}

export interface ICloud2FARequest {
    code: string;
}

export const integrationsService = {
    // iCloud
    icloudLogin: async (data: ICloudLoginRequest) => {
        const response = await api.post('/integrations/icloud/login/', data);
        return response.data;
    },

    icloudVerify2FA: async (data: ICloud2FARequest) => {
        const response = await api.post('/integrations/icloud/verify-2fa/', data);
        return response.data;
    },

    getICloudPhotos: async () => {
        const response = await api.get('/integrations/icloud/photos/');
        return response.data;
    },

    importICloudPhotos: async (photoIds: string[]) => {
        const response = await api.post('/integrations/icloud/import/', { photo_ids: photoIds });
        return response.data;
    },

    // Google
    getGoogleAuthUrl: async () => {
        const response = await api.get('/integrations/google/auth-url/');
        return response.data;
    },

    googleCallback: async (data: { code: string; redirect_uri: string }) => {
        const response = await api.post('/integrations/google/callback/', data);
        return response.data;
    }
};
