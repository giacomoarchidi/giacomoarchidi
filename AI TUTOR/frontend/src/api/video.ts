import { apiClient } from './client';

export interface JoinRoomRequest {
  lesson_id: number;
}

export interface JoinRoomResponse {
  token: string;
  app_id: string;
  channel: string;
  uid: number;
  expires_at: number;
  lesson_id: number;
}

export interface RoomStatus {
  lesson_id: number;
  channel: string;
  is_active: boolean;
  participants_count: number;
  start_time: string;
  end_time: string;
}

export interface RecordingResponse {
  message: string;
  lesson_id: number;
  recording_id?: string;
  recording_url?: string;
}

export const videoApi = {
  /**
   * Genera token per entrare nella video room
   */
  joinRoom: async (lessonId: number): Promise<JoinRoomResponse> => {
    const response = await apiClient.post('/video/join', {
      lesson_id: lessonId
    });
    return response.data;
  },

  /**
   * Ottieni status della video room
   */
  getRoomStatus: async (lessonId: number): Promise<RoomStatus> => {
    const response = await apiClient.get(`/video/room/${lessonId}/status`);
    return response.data;
  },

  /**
   * Avvia registrazione (solo tutor)
   */
  startRecording: async (lessonId: number): Promise<RecordingResponse> => {
    const response = await apiClient.post(`/video/room/${lessonId}/start-recording`);
    return response.data;
  },

  /**
   * Ferma registrazione (solo tutor)
   */
  stopRecording: async (lessonId: number): Promise<RecordingResponse> => {
    const response = await apiClient.post(`/video/room/${lessonId}/stop-recording`);
    return response.data;
  }
};
