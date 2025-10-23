import apiService from './api.service';
import {
  LoginRequest,
  LoginResponse,
  ApiResponse,
  User,
} from '../types/auth.types';
import AsyncStorage from '@react-native-async-storage/async-storage';

class AuthService {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiService.post<LoginResponse>(
      '/auth/login',
      credentials,
    );

    if (response.success) {
      // Store tokens and user data
      await AsyncStorage.setItem('authToken', response.data.token);
      await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response;
  }

  async logout(): Promise<void> {
    try {
      await apiService.post('/auth/logout');
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Clear all stored data
      await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'user']);
    }
  }

  async getCurrentUser(): Promise<ApiResponse<{user: User}>> {
    return await apiService.get<ApiResponse<{user: User}>>('/auth/me');
  }

  async getStoredUser(): Promise<User | null> {
    const userJson = await AsyncStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  }

  async getStoredToken(): Promise<string | null> {
    return await AsyncStorage.getItem('authToken');
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getStoredToken();
    return !!token;
  }
}

export default new AuthService();
