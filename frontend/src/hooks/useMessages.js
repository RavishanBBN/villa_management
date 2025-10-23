import { useState, useCallback } from 'react';
import { messageAPI } from '../services/api';
import { useAppContext } from '../context/AppContext';

export const useMessages = () => {
  const { currentUser, showSuccess, showError } = useAppContext();
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load all messages
  const loadMessages = useCallback(async () => {
    if (!currentUser?.id) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await messageAPI.getAll(currentUser.id);
      if (response.data.success) {
        setMessages(response.data.data || []);
        console.log('Messages loaded:', response.data.data?.length || 0);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
      setError('Failed to load messages');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!currentUser?.id) return;
    
    try {
      const response = await messageAPI.getConversations(currentUser.id);
      if (response.data.success) {
        setConversations(response.data.data.conversations || []);
        console.log('Conversations loaded:', response.data.data.conversations?.length || 0);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setConversations([]);
    }
  }, [currentUser]);

  // Load specific conversation
  const loadConversation = useCallback(async (userId1, userId2) => {
    try {
      const response = await messageAPI.getConversation(userId1, userId2);
      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (err) {
      console.error('Failed to load conversation:', err);
      return null;
    }
  }, []);

  // Send message
  const sendMessage = useCallback(async (messageData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await messageAPI.send(messageData);
      if (response.data.success) {
        await loadMessages();
        await loadConversations();
        showSuccess('Message sent successfully');
        return { success: true, data: response.data.data };
      }
      showError(response.data.message || 'Failed to send message');
      return { success: false, error: response.data.message };
    } catch (err) {
      console.error('Failed to send message:', err);
      showError('Failed to send message');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [loadMessages, loadConversations, showSuccess, showError]);

  // Mark as read
  const markAsRead = useCallback(async (messageId) => {
    try {
      const response = await messageAPI.markAsRead(messageId);
      if (response.data.success) {
        await loadMessages();
        return { success: true };
      }
      return { success: false, error: response.data.message };
    } catch (err) {
      console.error('Failed to mark message as read:', err);
      return { success: false, error: err.message };
    }
  }, [loadMessages]);

  // Delete message
  const deleteMessage = useCallback(async (messageId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await messageAPI.delete(messageId);
      if (response.data.success) {
        await loadMessages();
        await loadConversations();
        showSuccess('Message deleted successfully');
        return { success: true };
      }
      showError(response.data.message || 'Failed to delete message');
      return { success: false, error: response.data.message };
    } catch (err) {
      console.error('Failed to delete message:', err);
      showError('Failed to delete message');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [loadMessages, loadConversations, showSuccess, showError]);

  // Get unread count
  const getUnreadCount = useCallback(() => {
    return messages.filter(m => !m.read && m.receiverId === currentUser?.id).length;
  }, [messages, currentUser]);

  return {
    messages,
    conversations,
    selectedConversation,
    setSelectedConversation,
    loading,
    error,
    loadMessages,
    loadConversations,
    loadConversation,
    sendMessage,
    markAsRead,
    deleteMessage,
    getUnreadCount,
  };
};
