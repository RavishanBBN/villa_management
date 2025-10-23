import apiService from './api.service';
import {
  Invoice,
  GenerateInvoiceRequest,
  ApiResponse,
} from '../types/invoice.types';

class InvoiceService {
  async getAllInvoices(): Promise<ApiResponse<{invoices: Invoice[]}>> {
    return await apiService.get<ApiResponse<{invoices: Invoice[]}>>(
      '/invoices',
    );
  }

  async getInvoiceById(id: string): Promise<ApiResponse<{invoice: Invoice}>> {
    return await apiService.get<ApiResponse<{invoice: Invoice}>>(
      `/invoices/${id}`,
    );
  }

  async generateInvoiceForReservation(
    reservationId: string,
    data: Omit<GenerateInvoiceRequest, 'reservationId'>,
  ): Promise<ApiResponse<{invoice: Invoice}>> {
    return await apiService.post<ApiResponse<{invoice: Invoice}>>(
      `/invoices/generate/reservation/${reservationId}`,
      data,
    );
  }

  async recordPayment(
    invoiceId: string,
    payment: {
      amount: number;
      paymentMethod: string;
      paymentDate: string;
      notes?: string;
    },
  ): Promise<ApiResponse<{invoice: Invoice}>> {
    return await apiService.post<ApiResponse<{invoice: Invoice}>>(
      `/invoices/${invoiceId}/payment`,
      payment,
    );
  }

  async downloadInvoice(invoiceId: string): Promise<Blob> {
    return await apiService.get(`/invoices/${invoiceId}/download`, {
      responseType: 'blob',
    });
  }
}

export default new InvoiceService();
