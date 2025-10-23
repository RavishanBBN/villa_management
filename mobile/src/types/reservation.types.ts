export interface Property {
  id: string;
  name: string;
  type: string;
  location: string;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  status: 'available' | 'occupied' | 'maintenance';
}

export interface Guest {
  bookerName: string;
  country: string;
  email: string;
  phone: string;
}

export interface Reservation {
  id: string;
  propertyId: string;
  property?: Property;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  childrenAges?: number[];
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  source: 'direct' | 'airbnb' | 'booking' | 'other';
  guestInfo: Guest;
  specialRequests?: string;
  pricing: {
    basePrice: number;
    cleaningFee: number;
    serviceFee: number;
    totalUSD: number;
    totalLKR: number;
    currency: string;
  };
  paymentStatus: 'pending' | 'partial' | 'paid';
  createdAt: string;
  updatedAt: string;
}

export interface ReservationsState {
  reservations: Reservation[];
  selectedReservation: Reservation | null;
  isLoading: boolean;
  error: string | null;
}

export interface CreateReservationRequest {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  childrenAges?: number[];
  source: string;
  guestInfo: Guest;
  specialRequests?: string;
  paymentCurrency: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
