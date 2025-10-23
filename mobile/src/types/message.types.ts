export interface Message {
  id: string;
  subject: string;
  body: string;
  sender: string;
  recipient: string;
  read: boolean;
  priority: 'low' | 'normal' | 'high';
  category: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MessagesState {
  messages: Message[];
  selectedMessage: Message | null;
  isLoading: boolean;
  error: string | null;
}

export interface SendMessageRequest {
  subject: string;
  body: string;
  recipient: string;
  priority?: 'low' | 'normal' | 'high';
  category?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
