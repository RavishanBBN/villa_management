import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {
  MessagesState,
  Message,
  SendMessageRequest,
} from '../../types/message.types';
import messageService from '../../services/message.service';

const initialState: MessagesState = {
  messages: [],
  selectedMessage: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchMessages = createAsyncThunk(
  'messages/fetchAll',
  async (_, {rejectWithValue}) => {
    try {
      const response = await messageService.getAllMessages();
      if (response.success) {
        return response.data.messages;
      }
      return rejectWithValue('Failed to fetch messages');
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch messages',
      );
    }
  },
);

export const fetchMessageById = createAsyncThunk(
  'messages/fetchById',
  async (id: string, {rejectWithValue}) => {
    try {
      const response = await messageService.getMessageById(id);
      if (response.success) {
        return response.data.message;
      }
      return rejectWithValue('Failed to fetch message');
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch message',
      );
    }
  },
);

export const sendMessage = createAsyncThunk(
  'messages/send',
  async (data: SendMessageRequest, {rejectWithValue}) => {
    try {
      const response = await messageService.sendMessage(data);
      if (response.success) {
        return response.data.message;
      }
      return rejectWithValue('Failed to send message');
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to send message',
      );
    }
  },
);

export const markMessageAsRead = createAsyncThunk(
  'messages/markAsRead',
  async (id: string, {rejectWithValue}) => {
    try {
      const response = await messageService.markAsRead(id);
      if (response.success) {
        return response.data.message;
      }
      return rejectWithValue('Failed to mark message as read');
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to mark message as read',
      );
    }
  },
);

export const deleteMessage = createAsyncThunk(
  'messages/delete',
  async (id: string, {rejectWithValue}) => {
    try {
      await messageService.deleteMessage(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete message',
      );
    }
  },
);

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
    setSelectedMessage: (state, action: PayloadAction<Message | null>) => {
      state.selectedMessage = action.payload;
    },
    clearSelectedMessage: state => {
      state.selectedMessage = null;
    },
  },
  extraReducers: builder => {
    // Fetch all messages
    builder
      .addCase(fetchMessages.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        state.messages = action.payload;
        state.error = null;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch single message
    builder
      .addCase(fetchMessageById.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMessageById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedMessage = action.payload;
        state.error = null;
      })
      .addCase(fetchMessageById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Send message
    builder
      .addCase(sendMessage.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.messages.unshift(action.payload);
        state.error = null;
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Mark as read
    builder.addCase(markMessageAsRead.fulfilled, (state, action) => {
      const index = state.messages.findIndex((m: Message) => m.id === action.payload.id);
      if (index !== -1) {
        state.messages[index] = action.payload;
      }
      if (state.selectedMessage?.id === action.payload.id) {
        state.selectedMessage = action.payload;
      }
    });

    // Delete message
    builder.addCase(deleteMessage.fulfilled, (state, action) => {
      state.messages = state.messages.filter((m: Message) => m.id !== action.payload);
      if (state.selectedMessage?.id === action.payload) {
        state.selectedMessage = null;
      }
    });
  },
});

export const {clearError, setSelectedMessage, clearSelectedMessage} =
  messagesSlice.actions;
export default messagesSlice.reducer;
