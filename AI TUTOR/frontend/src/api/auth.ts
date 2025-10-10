import apiClient from './client';
import type { User, AuthResponse } from '../types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  role: 'student' | 'tutor' | 'parent';
  first_name: string;
  last_name: string;
  school_level?: string;
  bio?: string;
  subjects?: string;
  hourly_rate?: number;
  phone?: string;
}

export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
}

export const authApi = {
  // Login user
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  // Register user
  register: async (userData: RegisterRequest): Promise<User> => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  // Get current user profile
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  // Change password
  changePassword: async (passwordData: PasswordChangeRequest): Promise<{ message: string }> => {
    const response = await apiClient.put('/auth/password', passwordData);
    return response.data;
  },

  // Deactivate account
  deactivateAccount: async (): Promise<{ message: string }> => {
    const response = await apiClient.delete('/auth/deactivate');
    return response.data;
  },
};
