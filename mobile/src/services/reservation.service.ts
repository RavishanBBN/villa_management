import apiService from './api.service';
import {
  Reservation,
  CreateReservationRequest,
  ApiResponse,
} from '../types/reservation.types';

class ReservationService {
  async getAllReservations(): Promise<ApiResponse<{reservations: Reservation[]}>> {
    return await apiService.get<ApiResponse<{reservations: Reservation[]}>>(
      '/reservations',
    );
  }

  async getReservationById(id: string): Promise<ApiResponse<{reservation: Reservation}>> {
    return await apiService.get<ApiResponse<{reservation: Reservation}>>(
      `/reservations/${id}`,
    );
  }

  async createReservation(
    data: CreateReservationRequest,
  ): Promise<ApiResponse<{reservation: Reservation}>> {
    return await apiService.post<ApiResponse<{reservation: Reservation}>>(
      '/reservations',
      data,
    );
  }

  async updateReservation(
    id: string,
    data: Partial<CreateReservationRequest>,
  ): Promise<ApiResponse<{reservation: Reservation}>> {
    return await apiService.put<ApiResponse<{reservation: Reservation}>>(
      `/reservations/${id}`,
      data,
    );
  }

  async updateReservationStatus(
    id: string,
    status: string,
  ): Promise<ApiResponse<{reservation: Reservation}>> {
    return await apiService.patch<ApiResponse<{reservation: Reservation}>>(
      `/reservations/${id}/status`,
      {status},
    );
  }

  async deleteReservation(id: string): Promise<ApiResponse<void>> {
    return await apiService.delete<ApiResponse<void>>(`/reservations/${id}`);
  }
}

export default new ReservationService();
