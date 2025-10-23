import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {
  InvoicesState,
  Invoice,
  GenerateInvoiceRequest,
} from '../../types/invoice.types';
import invoiceService from '../../services/invoice.service';

const initialState: InvoicesState = {
  invoices: [],
  selectedInvoice: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchInvoices = createAsyncThunk(
  'invoices/fetchAll',
  async (_, {rejectWithValue}) => {
    try {
      const response = await invoiceService.getAllInvoices();
      if (response.success) {
        return response.data.invoices;
      }
      return rejectWithValue('Failed to fetch invoices');
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch invoices',
      );
    }
  },
);

export const fetchInvoiceById = createAsyncThunk(
  'invoices/fetchById',
  async (id: string, {rejectWithValue}) => {
    try {
      const response = await invoiceService.getInvoiceById(id);
      if (response.success) {
        return response.data.invoice;
      }
      return rejectWithValue('Failed to fetch invoice');
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch invoice',
      );
    }
  },
);

export const generateInvoice = createAsyncThunk(
  'invoices/generate',
  async (
    {
      reservationId,
      data,
    }: {
      reservationId: string;
      data: Omit<GenerateInvoiceRequest, 'reservationId'>;
    },
    {rejectWithValue},
  ) => {
    try {
      const response = await invoiceService.generateInvoiceForReservation(
        reservationId,
        data,
      );
      if (response.success) {
        return response.data.invoice;
      }
      return rejectWithValue('Failed to generate invoice');
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to generate invoice',
      );
    }
  },
);

export const recordPayment = createAsyncThunk(
  'invoices/recordPayment',
  async (
    {
      invoiceId,
      payment,
    }: {
      invoiceId: string;
      payment: {
        amount: number;
        paymentMethod: string;
        paymentDate: string;
        notes?: string;
      };
    },
    {rejectWithValue},
  ) => {
    try {
      const response = await invoiceService.recordPayment(invoiceId, payment);
      if (response.success) {
        return response.data.invoice;
      }
      return rejectWithValue('Failed to record payment');
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to record payment',
      );
    }
  },
);

const invoicesSlice = createSlice({
  name: 'invoices',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
    setSelectedInvoice: (state, action: PayloadAction<Invoice | null>) => {
      state.selectedInvoice = action.payload;
    },
    clearSelectedInvoice: state => {
      state.selectedInvoice = null;
    },
  },
  extraReducers: builder => {
    // Fetch all invoices
    builder
      .addCase(fetchInvoices.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.isLoading = false;
        state.invoices = action.payload;
        state.error = null;
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch single invoice
    builder
      .addCase(fetchInvoiceById.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchInvoiceById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedInvoice = action.payload;
        state.error = null;
      })
      .addCase(fetchInvoiceById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Generate invoice
    builder
      .addCase(generateInvoice.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(generateInvoice.fulfilled, (state, action) => {
        state.isLoading = false;
        state.invoices.unshift(action.payload);
        state.error = null;
      })
      .addCase(generateInvoice.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Record payment
    builder
      .addCase(recordPayment.fulfilled, (state, action) => {
        const index = state.invoices.findIndex(
          (i: Invoice) => i.id === action.payload.id,
        );
        if (index !== -1) {
          state.invoices[index] = action.payload;
        }
        if (state.selectedInvoice?.id === action.payload.id) {
          state.selectedInvoice = action.payload;
        }
      });
  },
});

export const {clearError, setSelectedInvoice, clearSelectedInvoice} =
  invoicesSlice.actions;
export default invoicesSlice.reducer;
