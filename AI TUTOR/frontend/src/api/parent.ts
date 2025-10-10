import apiClient from './client';
import { User, Lesson, Report, PaginatedResponse } from '../types';

export interface Child {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  school_level: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface ParentStats {
  total_children: number;
  total_lessons: number;
  completed_lessons: number;
  pending_payments: number;
  total_spent: number;
}

export interface ChildrenResponse {
  data: Child[];
  total: number;
  page: number;
  size: number;
}

export interface ChildLessonsResponse {
  data: Lesson[];
  total: number;
  page: number;
  size: number;
}

export interface ReportsResponse {
  data: Report[];
  total: number;
  page: number;
  size: number;
}

export const parentApi = {
  // Get parent dashboard statistics
  getStats: async (): Promise<ParentStats> => {
    const response = await apiClient.get('/parent/stats');
    return response.data;
  },

  // Get children
  getChildren: async (page = 1, size = 20): Promise<ChildrenResponse> => {
    const response = await apiClient.get('/parent/children', {
      params: { page, size }
    });
    return response.data;
  },

  // Get child details
  getChild: async (childId: number): Promise<Child> => {
    const response = await apiClient.get(`/parent/children/${childId}`);
    return response.data;
  },

  // Get child lessons
  getChildLessons: async (childId: number, page = 1, size = 20): Promise<ChildLessonsResponse> => {
    const response = await apiClient.get(`/parent/children/${childId}/lessons`, {
      params: { page, size }
    });
    return response.data;
  },

  // Get reports for children
  getReports: async (page = 1, size = 20): Promise<ReportsResponse> => {
    const response = await apiClient.get('/parent/reports', {
      params: { page, size }
    });
    return response.data;
  },

  // Get specific report
  getReport: async (reportId: number): Promise<Report> => {
    const response = await apiClient.get(`/parent/reports/${reportId}`);
    return response.data;
  },

  // Download report PDF
  downloadReport: async (reportId: number): Promise<Blob> => {
    const response = await apiClient.get(`/parent/reports/${reportId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  },
};
