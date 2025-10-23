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
} from 'react-native';
import {useAppDispatch, useAppSelector} from '../store/hooks';
import {
  fetchReservations,
  setSelectedReservation,
} from '../store/slices/reservationsSlice';
import {Reservation} from '../types/reservation.types';

const ReservationsScreen = ({navigation}: any) => {
  const dispatch = useAppDispatch();
  const {reservations, isLoading} = useAppSelector(
    state => state.reservations,
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = () => {
    dispatch(fetchReservations());
  };

  const filteredReservations = reservations.filter((reservation: Reservation) => {
    const matchesSearch =
      reservation.guestInfo.bookerName
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      reservation.property?.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === 'all' || reservation.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '#10b981';
      case 'checked_in':
        return '#3b82f6';
      case 'checked_out':
        return '#64748b';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#f59e0b';
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

  const renderReservation = ({item}: {item: Reservation}) => (
    <TouchableOpacity
      style={styles.reservationCard}
      onPress={() => {
        dispatch(setSelectedReservation(item));
        navigation.navigate('ReservationDetail', {reservationId: item.id});
      }}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.guestName}>{item.guestInfo.bookerName}</Text>
          <Text style={styles.propertyName}>
            {item.property?.name || 'Property N/A'}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            {backgroundColor: getStatusColor(item.status) + '20'},
          ]}>
          <Text
            style={[styles.statusText, {color: getStatusColor(item.status)}]}>
            {item.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.cardDates}>
        <View style={styles.dateItem}>
          <Text style={styles.dateLabel}>Check-in</Text>
          <Text style={styles.dateValue}>{formatDate(item.checkIn)}</Text>
        </View>
        <Text style={styles.dateArrow}>→</Text>
        <View style={styles.dateItem}>
          <Text style={styles.dateLabel}>Check-out</Text>
          <Text style={styles.dateValue}>{formatDate(item.checkOut)}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.guests}>
          👥 {item.adults} Adults
          {item.children > 0 && `, ${item.children} Children`}
        </Text>
        <Text style={styles.price}>
          {formatCurrency(
            item.pricing.totalLKR,
            item.pricing.currency || 'LKR',
          )}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const StatusFilter = () => (
    <View style={styles.filterContainer}>
      {['all', 'confirmed', 'checked_in', 'checked_out', 'cancelled'].map(
        status => (
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
              {status.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ),
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by guest or property..."
          placeholderTextColor="#64748b"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Status Filters */}
      <StatusFilter />

      {/* Reservations List */}
      {isLoading && reservations.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading reservations...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredReservations}
          renderItem={renderReservation}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={loadReservations}
              tintColor="#10b981"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📅</Text>
              <Text style={styles.emptyText}>No reservations found</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#fff',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#94a3b8',
    textTransform: 'capitalize',
  },
  filterButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  reservationCard: {
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
  guestName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  propertyName: {
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
    alignItems: 'center',
    justifyContent: 'space-between',
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
  dateArrow: {
    fontSize: 16,
    color: '#64748b',
    marginHorizontal: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  guests: {
    fontSize: 13,
    color: '#94a3b8',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
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
});

export default ReservationsScreen;
