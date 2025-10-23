import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import {useAppDispatch, useAppSelector} from '../store/hooks';
import {
  fetchMessages,
  sendMessage,
  markMessageAsRead,
  setSelectedMessage,
} from '../store/slices/messagesSlice';
import {Message} from '../types/message.types';

const MessagesScreen = ({navigation}: any) => {
  const dispatch = useAppDispatch();
  const {messages, isLoading} = useAppSelector(state => state.messages);
  const {user} = useAppSelector(state => state.auth);
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'read'>(
    'all',
  );
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [composing, setComposing] = useState(false);
  const [newMessage, setNewMessage] = useState({
    recipient: '',
    subject: '',
    body: '',
    priority: 'normal' as 'low' | 'normal' | 'high',
    category: 'general' as
      | 'general'
      | 'maintenance'
      | 'housekeeping'
      | 'reservation'
      | 'billing',
  });

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = () => {
    dispatch(fetchMessages());
  };

  const handleSendMessage = async () => {
    if (!newMessage.recipient || !newMessage.subject || !newMessage.body) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setComposing(true);
      await dispatch(sendMessage(newMessage)).unwrap();
      Alert.alert('Success', 'Message sent successfully!');
      setShowComposeModal(false);
      setNewMessage({
        recipient: '',
        subject: '',
        body: '',
        priority: 'normal',
        category: 'general',
      });
      loadMessages();
    } catch (error: any) {
      Alert.alert('Error', error || 'Failed to send message');
    } finally {
      setComposing(false);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await dispatch(markMessageAsRead(messageId)).unwrap();
      loadMessages();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const filteredMessages = messages.filter((message: Message) => {
    if (filterStatus === 'all') return true;
    return filterStatus === 'read' ? message.read : !message.read;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#ef4444';
      case 'low':
        return '#64748b';
      default:
        return '#3b82f6';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'maintenance':
        return '#f59e0b';
      case 'housekeeping':
        return '#8b5cf6';
      case 'reservation':
        return '#10b981';
      case 'billing':
        return '#ef4444';
      default:
        return '#3b82f6';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const renderMessage = ({item}: {item: Message}) => {
    const isOutgoing = item.sender === user?.id;
    const unread = !item.read && !isOutgoing;

    return (
      <TouchableOpacity
        style={[styles.messageCard, unread && styles.messageCardUnread]}
        onPress={() => {
          if (unread) {
            handleMarkAsRead(item.id);
          }
          dispatch(setSelectedMessage(item));
          navigation.navigate('MessageDetail', {messageId: item.id});
        }}>
        <View style={styles.messageHeader}>
          <View style={styles.messageHeaderLeft}>
            <Text style={[styles.senderName, unread && styles.unreadText]}>
              {isOutgoing ? `To: ${item.recipient}` : item.sender}
            </Text>
            <Text style={styles.messageDate}>{formatDate(item.createdAt)}</Text>
          </View>
          <View style={styles.badges}>
            <View
              style={[
                styles.priorityBadge,
                {backgroundColor: getPriorityColor(item.priority) + '20'},
              ]}>
              <Text
                style={[
                  styles.badgeText,
                  {color: getPriorityColor(item.priority)},
                ]}>
                {item.priority.toUpperCase()}
              </Text>
            </View>
            {unread && <View style={styles.unreadDot} />}
          </View>
        </View>

        <Text style={[styles.subject, unread && styles.unreadText]}>
          {item.subject}
        </Text>

        <Text style={styles.bodyPreview} numberOfLines={2}>
          {item.body}
        </Text>

        <View style={styles.messageFooter}>
          <View
            style={[
              styles.categoryBadge,
              {backgroundColor: getCategoryColor(item.category) + '20'},
            ]}>
            <Text
              style={[
                styles.categoryText,
                {color: getCategoryColor(item.category)},
              ]}>
              {item.category.toUpperCase()}
            </Text>
          </View>
          {item.attachments && item.attachments.length > 0 && (
            <Text style={styles.attachmentCount}>
              📎 {item.attachments.length}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const ComposeModal = () => (
    <Modal
      visible={showComposeModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowComposeModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Compose Message</Text>

          <TextInput
            style={styles.input}
            placeholder="Recipient User ID"
            placeholderTextColor="#64748b"
            value={newMessage.recipient}
            onChangeText={text =>
              setNewMessage({...newMessage, recipient: text})
            }
          />

          <TextInput
            style={styles.input}
            placeholder="Subject"
            placeholderTextColor="#64748b"
            value={newMessage.subject}
            onChangeText={text => setNewMessage({...newMessage, subject: text})}
          />

          <TextInput
            style={[styles.input, styles.bodyInput]}
            placeholder="Message body"
            placeholderTextColor="#64748b"
            value={newMessage.body}
            onChangeText={text => setNewMessage({...newMessage, body: text})}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          <View style={styles.selectRow}>
            <View style={styles.selectContainer}>
              <Text style={styles.selectLabel}>Priority</Text>
              <View style={styles.selectButtons}>
                {(['low', 'normal', 'high'] as const).map(priority => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.selectButton,
                      newMessage.priority === priority &&
                        styles.selectButtonActive,
                    ]}
                    onPress={() =>
                      setNewMessage({...newMessage, priority})
                    }>
                    <Text
                      style={[
                        styles.selectButtonText,
                        newMessage.priority === priority &&
                          styles.selectButtonTextActive,
                      ]}>
                      {priority}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.selectRow}>
            <View style={styles.selectContainer}>
              <Text style={styles.selectLabel}>Category</Text>
              <View style={styles.selectButtons}>
                {(
                  [
                    'general',
                    'maintenance',
                    'housekeeping',
                    'reservation',
                    'billing',
                  ] as const
                ).map(category => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.selectButton,
                      newMessage.category === category &&
                        styles.selectButtonActive,
                    ]}
                    onPress={() =>
                      setNewMessage({...newMessage, category})
                    }>
                    <Text
                      style={[
                        styles.selectButtonText,
                        newMessage.category === category &&
                          styles.selectButtonTextActive,
                      ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowComposeModal(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.sendButton,
                composing && styles.sendButtonDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={composing}>
              {composing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.sendButtonText}>Send</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header with Compose Button */}
      <View style={styles.header}>
        <View style={styles.filterButtons}>
          {(['all', 'unread', 'read'] as const).map(status => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                filterStatus === status && styles.filterButtonActive,
              ]}
              onPress={() => setFilterStatus(status)}>
              <Text
                style={[
                  styles.filterButtonText,
                  filterStatus === status && styles.filterButtonTextActive,
                ]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={styles.composeButton}
          onPress={() => setShowComposeModal(true)}>
          <Text style={styles.composeButtonText}>✉️ Compose</Text>
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      {isLoading && messages.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredMessages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={loadMessages}
              tintColor="#10b981"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>✉️</Text>
              <Text style={styles.emptyText}>No messages found</Text>
            </View>
          }
        />
      )}

      <ComposeModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    padding: 16,
    gap: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  filterButtonText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  composeButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  composeButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  messageCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  messageCardUnread: {
    borderColor: '#10b981',
    borderLeftWidth: 4,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  messageHeaderLeft: {
    flex: 1,
  },
  senderName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 2,
  },
  unreadText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  messageDate: {
    fontSize: 12,
    color: '#64748b',
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
  },
  subject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 6,
  },
  bodyPreview: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
    marginBottom: 12,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  attachmentCount: {
    fontSize: 12,
    color: '#64748b',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#fff',
    marginBottom: 12,
  },
  bodyInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  selectRow: {
    marginBottom: 16,
  },
  selectContainer: {
    flex: 1,
  },
  selectLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 8,
  },
  selectButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
  },
  selectButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  selectButtonText: {
    fontSize: 12,
    color: '#94a3b8',
    textTransform: 'capitalize',
  },
  selectButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#334155',
  },
  cancelButtonText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sendButton: {
    backgroundColor: '#10b981',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(16, 185, 129, 0.6)',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MessagesScreen;
