export interface User {
  id: number;
  email: string;
  role: 'student' | 'tutor' | 'parent' | 'admin';
  first_name?: string;
  last_name?: string;
  school_level?: string;
  bio?: string;
  subjects?: string;
  hourly_rate?: number;
  phone?: string;
  is_verified?: boolean;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface Lesson {
  id: number;
  student_id: number;
  tutor_id: number;
  subject: string;
  start_at: string;
  end_at: string;
  status: 'pending_payment' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  room_slug?: string;
  notes_text?: string;
  notes_pdf_path?: string;
  tutor_notes?: string;
  objectives?: string;
  price?: number;
  created_at: string;
  updated_at: string;
}

export interface Availability {
  id: number;
  weekday: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  created_at: string;
}

export interface Payment {
  id: number;
  student_id: number;
  lesson_id: number;
  amount: number;
  currency: string;
  status: 'created' | 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';
  stripe_session_id?: string;
  receipt_url?: string;
  created_at: string;
}

export interface File {
  id: number;
  filename: string;
  size: number;
  size_display: string;
  content_type: string;
  created_at: string;
  is_expired: boolean;
}

export interface Feedback {
  id: number;
  parent_id: number;
  tutor_id: number;
  lesson_id: number;
  rating: number;
  comment?: string;
  is_public: boolean;
  created_at: string;
}

export interface Report {
  id: number;
  student_id: number;
  period_start: string;
  period_end: string;
  title: string;
  text?: string;
  pdf_path?: string;
  status: 'draft' | 'generating' | 'published' | 'failed';
  lessons_count: number;
  created_at: string;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  size: number;
}
