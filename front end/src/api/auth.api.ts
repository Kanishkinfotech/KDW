import apiClient from './apiClient';

export interface UserProfile {
  id: string;
  customerCode?: string | null;
  name: string;
  email: string;
  mobile?: string | null;
  profileImage?: string | null;
  role: string;
  emailVerified?: boolean;
  customerType?: string;
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: UserProfile;
  message?: string;
}

export const authApi = {
  // 1. Register new customer account
  register: async (payload: { name: string; email: string; password: string; mobile?: string }): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/register', payload);
    return res.data;
  },

  // 2. Authenticate existing customer/admin
  login: async (payload: { email: string; password: string }): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/login', payload);
    return res.data;
  },

  // 3. Retrieve authenticated session profile
  getMe: async (): Promise<{ success: boolean; user: UserProfile }> => {
    const res = await apiClient.get<{ success: boolean; user: UserProfile }>('/auth/me');
    return res.data;
  },

  // 4. Logout and invalidate session
  logout: async (): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.post<{ success: boolean; message: string }>('/auth/logout');
    return res.data;
  },

  // 5. Update user profile information
  updateProfile: async (payload: { name?: string; mobile?: string; profileImage?: string }): Promise<{ success: boolean; user: UserProfile }> => {
    const res = await apiClient.put<{ success: boolean; user: UserProfile }>('/auth/profile', payload);
    return res.data;
  },

  // 6. Request password reset token
  forgotPassword: async (payload: { email: string }): Promise<{ success: boolean; message: string; token?: string }> => {
    const res = await apiClient.post<{ success: boolean; message: string; token?: string }>('/auth/forgot-password', payload);
    return res.data;
  },

  // 7. Reset password using token
  resetPassword: async (payload: { password: string; email?: string; token?: string }): Promise<{ success: boolean; message: string }> => {
    const url = payload.token ? `/auth/reset-password/${encodeURIComponent(payload.token)}` : '/auth/reset-password';
    const res = await apiClient.post<{ success: boolean; message: string }>(url, payload);
    return res.data;
  }
};

export default authApi;
