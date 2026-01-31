import { API_URL } from '../config/api';

const API_BASE_URL = API_URL;

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    name: string;
    email: string;
    created_at: string;
  };
  session?: {
    access_token: string;
    refresh_token: string;
  };
  settings?: {
    currency: string;
    daily_budget: number;
    limit_updated_at?: string | null;
    avatar_url?: string | null;
  };
  testLink?: string;
  note?: string;
  error?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials extends LoginCredentials {
  name?: string;
}

class AuthService {
  async signup(credentials: SignupCredentials): Promise<AuthResponse> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
          name: credentials.name,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          message: 'Request timed out. Please check your connection.',
          error: 'Network timeout',
        };
      }
      return {
        success: false,
        message: 'Network error occurred',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          message: 'Request timed out. Please check your connection.',
          error: 'Network timeout',
        };
      }
      return {
        success: false,
        message: 'Network error occurred',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async validateToken(token: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/protected/protected`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        message: 'Token validation failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async updateProfile(email: string, name?: string, currency?: string, dailyBudget?: number, avatar?: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name,
          currency,
          dailyBudget,
          avatar
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        message: 'Profile update failed',
        error: error instanceof Error ? error.message : 'Profile update failed'
      };
    }
  }

  async forgotPassword(email: string): Promise<AuthResponse> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${API_BASE_URL}/auth/reset-password-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          message: 'Request timed out. Please check your connection.',
          error: 'Network timeout',
        };
      }
      return {
        success: false,
        message: 'Network error occurred',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const authService = new AuthService();
