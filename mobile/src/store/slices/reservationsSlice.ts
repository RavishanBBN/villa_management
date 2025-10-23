import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {
  ReservationsState,
  Reservation,
  CreateReservationRequest,
} from '../../types/reservation.types';
import reservationService from '../../services/reservation.service';

const initialState: ReservationsState = {
  reservations: [],
  selectedReservation: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchReservations = createAsyncThunk(
  'reservations/fetchAll',
  async (_, {rejectWithValue}) => {
    try {
      const response = await reservationService.getAllReservations();
      if (response.success) {
        return response.data.reservations;
      }
      return rejectWithValue('Failed to fetch reservations');
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch reservations',
      );
    }
  },
);

export const fetchReservationById = createAsyncThunk(
  'reservations/fetchById',
  async (id: string, {rejectWithValue}) => {
    try {
      const response = await reservationService.getReservationById(id);
      if (response.success) {
        return response.data.reservation;
      }
      return rejectWithValue('Failed to fetch reservation');
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch reservation',
      );
    }
  },
);

export const createReservation = createAsyncThunk(
  'reservations/create',
  async (data: CreateReservationRequest, {rejectWithValue}) => {
    try {
      const response = await reservationService.createReservation(data);
      if (response.success) {
        return response.data.reservation;
      }
      return rejectWithValue('Failed to create reservation');
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create reservation',
      );
    }
  },
);

export const updateReservationStatus = createAsyncThunk(
  'reservations/updateStatus',
  async ({id, status}: {id: string; status: string}, {rejectWithValue}) => {
    try {
      const response = await reservationService.updateReservationStatus(
        id,
        status,
      );
      if (response.success) {
        return response.data.reservation;
      }
      return rejectWithValue('Failed to update reservation status');
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update reservation status',
      );
    }
  },
);

const reservationsSlice = createSlice({
  name: 'reservations',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
    setSelectedReservation: (state, action: PayloadAction<Reservation | null>) => {
      state.selectedReservation = action.payload;
    },
    clearSelectedReservation: state => {
      state.selectedReservation = null;
    },
  },
  extraReducers: builder => {
    // Fetch all reservations
    builder
      .addCase(fetchReservations.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchReservations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reservations = action.payload;
        state.error = null;
      })
      .addCase(fetchReservations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch single reservation
    builder
      .addCase(fetchReservationById.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchReservationById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedReservation = action.payload;
        state.error = null;
      })
      .addCase(fetchReservationById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create reservation
    builder
      .addCase(createReservation.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createReservation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reservations.unshift(action.payload);
        state.error = null;
      })
      .addCase(createReservation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update reservation status
    builder
      .addCase(updateReservationStatus.fulfilled, (state, action) => {
        const index = state.reservations.findIndex(
          (r: Reservation) => r.id === action.payload.id,
        );
        if (index !== -1) {
          state.reservations[index] = action.payload;
        }
        if (state.selectedReservation?.id === action.payload.id) {
          state.selectedReservation = action.payload;
        }
      });
  },
});

export const {clearError, setSelectedReservation, clearSelectedReservation} =
  reservationsSlice.actions;
export default reservationsSlice.reducer;
