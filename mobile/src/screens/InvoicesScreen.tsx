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
  Alert,
  Modal,
} from 'react-native';
import {useAppDispatch, useAppSelector} from '../store/hooks';
import {
  fetchInvoices,
  generateInvoice,
  setSelectedInvoice,
} from '../store/slices/invoicesSlice';
import {fetchReservations} from '../store/slices/reservationsSlice';
import {Invoice} from '../types/invoice.types';

const InvoicesScreen = ({navigation}: any) => {
  const dispatch = useAppDispatch();
  const {invoices, isLoading} = useAppSelector(state => state.invoices);
  const {reservations} = useAppSelector(state => state.reservations);
  const [searchQuery, setSearchQuery] = useState('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedReservationId, setSelectedReservationId] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadInvoices();
    dispatch(fetchReservations());
  }, []);

  const loadInvoices = () => {
    dispatch(fetchInvoices());
  };

  const handleGenerateInvoice = async () => {
    if (!selectedReservationId) {
      Alert.alert('Error', 'Please select a reservation');
      return;
    }

    try {
      setGenerating(true);
      await dispatch(
        generateInvoice({
          reservationId: selectedReservationId,
          data: {
            issueDate: new Date().toISOString().split('T')[0],
            notes: 'Generated from mobile app',
          },
        }),
      ).unwrap();

      Alert.alert('Success', 'Invoice generated successfully!');
      setShowGenerateModal(false);
      setSelectedReservationId('');
      loadInvoices();
    } catch (error: any) {
      Alert.alert('Error', error || 'Failed to generate invoice');
    } finally {
      setGenerating(false);
    }
  };

  const filteredInvoices = invoices.filter((invoice: Invoice) =>
    invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.issuedTo.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return '#10b981';
      case 'partially_paid':
        return '#f59e0b';
      case 'overdue':
        return '#ef4444';
      default:
        return '#64748b';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency} ${amount.toLocaleString()}`;
  };

  const renderInvoice = ({item}: {item: Invoice}) => (
    <TouchableOpacity
      style={styles.invoiceCard}
      onPress={() => {
        dispatch(setSelectedInvoice(item));
        navigation.navigate('InvoiceDetail', {invoiceId: item.id});
      }}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.invoiceNumber}>{item.invoiceNumber}</Text>
          <Text style={styles.issuedTo}>{item.issuedTo}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            {backgroundColor: getStatusColor(item.paymentStatus) + '20'},
          ]}>
          <Text
            style={[
              styles.statusText,
              {color: getStatusColor(item.paymentStatus)},
            ]}>
            {item.paymentStatus.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.cardDates}>
        <View style={styles.dateItem}>
          <Text style={styles.dateLabel}>Issue Date</Text>
          <Text style={styles.dateValue}>{formatDate(item.issueDate)}</Text>
        </View>
        {item.dueDate && (
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Due Date</Text>
            <Text style={styles.dateValue}>{formatDate(item.dueDate)}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.type}>
          {item.type.replace('_', ' ').toUpperCase()}
        </Text>
        <Text style={styles.amount}>
          {formatCurrency(item.totalAmount, item.currency)}
        </Text>
      </View>

      {item.paidAmount > 0 && (
        <Text style={styles.paidAmount}>
          Paid: {formatCurrency(item.paidAmount, item.currency)}
        </Text>
      )}
    </TouchableOpacity>
  );

  const GenerateInvoiceModal = () => (
    <Modal
      visible={showGenerateModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowGenerateModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Generate Invoice</Text>

          <Text style={styles.modalLabel}>Select Reservation</Text>
          <View style={styles.reservationList}>
            {reservations
              .filter((r: any) => r.status === 'confirmed' || r.status === 'checked_in')
              .map((reservation: any) => (
                <TouchableOpacity
                  key={reservation.id}
                  style={[
                    styles.reservationItem,
                    selectedReservationId === reservation.id &&
                      styles.reservationItemSelected,
                  ]}
                  onPress={() => setSelectedReservationId(reservation.id)}>
                  <Text style={styles.reservationName}>
                    {reservation.guestInfo.bookerName}
                  </Text>
                  <Text style={styles.reservationDetails}>
                    {formatDate(reservation.checkIn)} -{' '}
                    {formatDate(reservation.checkOut)}
                  </Text>
                  <Text style={styles.reservationAmount}>
                    {formatCurrency(
                      reservation.pricing.totalLKR,
                      reservation.pricing.currency,
                    )}
                  </Text>
                </TouchableOpacity>
              ))}
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => {
                setShowGenerateModal(false);
                setSelectedReservationId('');
              }}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.generateButton,
                generating && styles.generateButtonDisabled,
              ]}
              onPress={handleGenerateInvoice}
              disabled={generating || !selectedReservationId}>
              {generating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.generateButtonText}>Generate</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header with Generate Button */}
      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search invoices..."
          placeholderTextColor="#64748b"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity
          style={styles.generateButton}
          onPress={() => setShowGenerateModal(true)}>
          <Text style={styles.generateButtonText}>+ Generate</Text>
        </TouchableOpacity>
      </View>

      {/* Invoices List */}
      {isLoading && invoices.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading invoices...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredInvoices}
          renderItem={renderInvoice}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={loadInvoices}
              tintColor="#10b981"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📄</Text>
              <Text style={styles.emptyText}>No invoices found</Text>
            </View>
          }
        />
      )}

      <GenerateInvoiceModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#fff',
  },
  generateButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  generateButtonDisabled: {
    backgroundColor: 'rgba(16, 185, 129, 0.6)',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  invoiceCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  issuedTo: {
    fontSize: 14,
    color: '#94a3b8',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  cardDates: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#334155',
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 13,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  type: {
    fontSize: 11,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
  paidAmount: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'right',
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
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 12,
  },
  reservationList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  reservationItem: {
    backgroundColor: '#0f172a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#334155',
  },
  reservationItemSelected: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  reservationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  reservationDetails: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 4,
  },
  reservationAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10b981',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
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
});

export default InvoicesScreen;
