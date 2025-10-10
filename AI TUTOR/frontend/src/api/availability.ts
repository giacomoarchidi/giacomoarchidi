import { apiClient } from './client';

export interface AvailabilitySlot {
  id?: number;
  weekday: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export interface AvailabilityResponse {
  availability: AvailabilitySlot[];
}

export const availabilityApi = {
  // Ottieni la disponibilità del tutor
  getAvailability: async (): Promise<AvailabilitySlot[]> => {
    const response = await apiClient.get('/tutor/availability');
    return response.data;
  },

  // Salva la disponibilità del tutor (usa PUT come nel backend)
  saveAvailability: async (availability: AvailabilitySlot[]): Promise<AvailabilitySlot[]> => {
    const response = await apiClient.put('/tutor/availability', availability);
    return response.data;
  },

  // Aggiorna la disponibilità del tutor
  updateAvailability: async (availability: AvailabilitySlot[]): Promise<AvailabilitySlot[]> => {
    const response = await apiClient.put('/tutor/availability', availability);
    return response.data;
  },
};
