import apiClient from './client';
import { User, Lesson, Payment, PaginatedResponse } from '../types';

export interface AdminStats {
  total_users: number;
  total_students: number;
  total_tutors: number;
  total_parents: number;
  total_lessons: number;
  total_revenue: number;
  pending_verifications: number;
  active_lessons_today: number;
}

export interface UserListResponse {
  data: User[];
  total: number;
  page: number;
  size: number;
}

export interface LessonListResponse {
  data: Lesson[];
  total: number;
  page: number;
  size: number;
}

export interface PaymentListResponse {
  data: Payment[];
  total: number;
  page: number;
  size: number;
}

export const adminApi = {
  // Get admin dashboard statistics
  getStats: async (): Promise<AdminStats> => {
    const response = await apiClient.get('/admin/stats');
    return response.data;
  },

  // Get all users
  getUsers: async (page = 1, size = 20, role?: string): Promise<UserListResponse> => {
    const params: any = { page, size };
    if (role) params.role = role;
    
    const response = await apiClient.get('/admin/users', { params });
    return response.data;
  },

  // Get user details
  getUser: async (userId: number): Promise<User> => {
    const response = await apiClient.get(`/admin/users/${userId}`);
    return response.data;
  },

  // Update user status
  updateUserStatus: async (userId: number, isActive: boolean): Promise<User> => {
    const response = await apiClient.put(`/admin/users/${userId}/status`, { is_active: isActive });
    return response.data;
  },

  // Get all lessons
  getAllLessons: async (page = 1, size = 20, status?: string): Promise<LessonListResponse> => {
    const params: any = { page, size };
    if (status) params.status = status;
    
    const response = await apiClient.get('/admin/lessons', { params });
    return response.data;
  },

  // Get lesson details
  getLesson: async (lessonId: number): Promise<Lesson> => {
    const response = await apiClient.get(`/admin/lessons/${lessonId}`);
    return response.data;
  },

  // Get all payments
  getAllPayments: async (page = 1, size = 20, status?: string): Promise<PaymentListResponse> => {
    const params: any = { page, size };
    if (status) params.status = status;
    
    const response = await apiClient.get('/admin/payments', { params });
    return response.data;
  },

  // Refund payment
  refundPayment: async (paymentId: number, reason?: string): Promise<{ message: string }> => {
    const response = await apiClient.post(`/admin/payments/${paymentId}/refund`, { reason });
    return response.data;
  },
};
