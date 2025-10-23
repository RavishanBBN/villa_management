import apiService from './api.service';
import {
  Message,
  SendMessageRequest,
  ApiResponse,
} from '../types/message.types';

class MessageService {
  async getAllMessages(): Promise<ApiResponse<{messages: Message[]}>> {
    return await apiService.get<ApiResponse<{messages: Message[]}>>(
      '/messages',
    );
  }

  async getMessageById(id: string): Promise<ApiResponse<{message: Message}>> {
    return await apiService.get<ApiResponse<{message: Message}>>(
      `/messages/${id}`,
    );
  }

  async sendMessage(
    data: SendMessageRequest,
  ): Promise<ApiResponse<{message: Message}>> {
    return await apiService.post<ApiResponse<{message: Message}>>(
      '/messages',
      data,
    );
  }

  async markAsRead(id: string): Promise<ApiResponse<{message: Message}>> {
    return await apiService.patch<ApiResponse<{message: Message}>>(
      `/messages/${id}/read`,
      {},
    );
  }

  async deleteMessage(id: string): Promise<ApiResponse<void>> {
    return await apiService.delete<ApiResponse<void>>(`/messages/${id}`);
  }
}

export default new MessageService();
