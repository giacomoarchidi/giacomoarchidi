import { apiClient } from './client';

export interface TutorResponse {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  bio: string;
  subjects: string[];
  hourly_rate: number;
  is_verified: boolean;
  rating?: number;
  total_lessons?: number;
  profile_image?: string;
  availability: {
    weekday: number;
    start_time: string;
    end_time: string;
  }[];
}

export interface LessonCreateRequest {
  tutor_id: number;
  subject: string;
  start_at: string;
  duration_minutes: number;
  objectives?: string;
}

export interface LessonCreateResponse {
  id: number;
  student_id: number;
  tutor_id: number;
  subject: string;
  start_at: string;
  end_at: string;
  status: string;
  price: number;
  created_at: string;
}

export const lessonsApi = {
  getTutorsBySubject: async (subject: string): Promise<TutorResponse[]> => {
    const response = await apiClient.get(`/lessons/tutors/subject/${subject}`);
    return response.data;
  },
  
  createLesson: async (lessonData: LessonCreateRequest): Promise<LessonCreateResponse> => {
    const response = await apiClient.post('/lessons/', lessonData);
    return response.data;
  },
};
