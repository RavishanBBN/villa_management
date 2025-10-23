import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {AuthState, LoginRequest, User} from '../../types/auth.types';
import authService from '../../services/auth.service';

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, {rejectWithValue}) => {
    try {
      const response = await authService.login(credentials);
      if (response.success) {
        return response.data;
      }
      return rejectWithValue(response.message || 'Login failed');
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Login failed',
      );
    }
  },
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await authService.logout();
});

export const loadStoredUser = createAsyncThunk('auth/loadStoredUser', async () => {
  const user = await authService.getStoredUser();
  const token = await authService.getStoredToken();
  return {user, token};
});

export const getCurrentUser = createAsyncThunk('auth/getCurrentUser', async () => {
  const response = await authService.getCurrentUser();
  return response.data.user;
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
  },
  extraReducers: builder => {
    // Login
    builder
      .addCase(login.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Logout
    builder.addCase(logout.fulfilled, state => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
    });

    // Load stored user
    builder.addCase(loadStoredUser.fulfilled, (state, action) => {
      if (action.payload.user && action.payload.token) {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      }
    });

    // Get current user
    builder
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(getCurrentUser.rejected, state => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
      });
  },
});

export const {clearError, setUser} = authSlice.actions;
export default authSlice.reducer;
