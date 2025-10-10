import apiClient from './client';
import type { File as FileType } from '../types';

export interface FileUploadResponse {
  file_id: number;
  filename: string;
  size: number;
  content_type: string;
  message: string;
}

export interface FileListResponse {
  data: FileType[];
  total: number;
  page: number;
  size: number;
}

export interface PresignedUrlResponse {
  url: string;
  expires_in: number;
}

export const filesApi = {
  // Upload a file
  uploadFile: async (file: globalThis.File): Promise<FileUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get user's files
  getUserFiles: async (page = 1, size = 20): Promise<FileListResponse> => {
    const response = await apiClient.get('/files', {
      params: { page, size }
    });
    return response.data;
  },

  // Get file details
  getFile: async (fileId: number): Promise<FileType> => {
    const response = await apiClient.get(`/files/${fileId}`);
    return response.data;
  },

  // Get presigned URL for file download
  getPresignedUrl: async (fileId: number): Promise<PresignedUrlResponse> => {
    const response = await apiClient.get(`/files/${fileId}/url`);
    return response.data;
  },

  // Delete a file
  deleteFile: async (fileId: number): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/files/${fileId}`);
    return response.data;
  },
};
