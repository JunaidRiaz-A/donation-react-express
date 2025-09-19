import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

interface User {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  role: 'admin' | 'host' | 'Participant';
  createdAt: string;
  isEmailVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: { firstname: string; lastname: string; email: string; password: string; role: 'host' | 'Participant' }) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  refreshToken: () => Promise<string>;
  setUser: (user: User | null) => void;
  loading: boolean;
  resendVerificationEmail: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      console.log('Initializing auth - Stored user:', storedUser, 'Token:', token);

      if (storedUser && token) {
        try {
          const parsedUser = JSON.parse(storedUser);
          if (!['admin', 'host', 'Participant'].includes(parsedUser.role)) {
            throw new Error('Invalid role');
          }
          setUser(parsedUser);
          setIsAuthenticated(true);
          if (parsedUser.isEmailVerified === false) {
            setIsAuthenticated(false);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
          }
        } catch (err) {
          console.error('Error parsing stored user:', err);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const redirectToDashboard = (role: string) => {
    switch (role) {
      case 'admin':
        navigate('/dashboard/admin');
        break;
      case 'host':
        navigate('/dashboard/host');
        break;
      case 'Participant':
        navigate('/dashboard/Participant');
        break;
      default:
        navigate('/dashboard');
    }
  };

  const refreshToken = async (): Promise<string> => {
    try {
      const response = await axiosInstance.post('/users/refresh-token', {}, {
        headers: { 'X-Skip-Redirect': 'true' },
      });
      const { token } = response.data;
      localStorage.setItem('token', token);
      return token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await axiosInstance.post('/users/login', { email, password });
      const { token, user } = response.data;
      console.log('Login response:', response.data);
      const isVerified = user.isEmailVerified !== false;
      if (!isVerified) {
        throw new Error('Please verify your email before logging in');
      }
      if (!['admin', 'host', 'Participant'].includes(user.role)) {
        throw new Error('Invalid role');
      }
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({ ...user, isEmailVerified: isVerified }));
      setUser({ ...user, isEmailVerified: isVerified });
      setIsAuthenticated(true);
      redirectToDashboard(user.role);
    } catch (error: any) {
      console.error('Login failed:', error.response?.data || error.message);
      if (error.response?.status === 403) {
        throw new Error('Please verify your email before logging in');
      } else if (error.response?.status === 400) {
        throw new Error('Invalid Email or Password');
      }
      throw error;
    }
  };

  const register = async (userData: { firstname: string; lastname: string; email: string; password: string; role: 'host' | 'Participant' }) => {
    try {
      if (!['host', 'Participant'].includes(userData.role)) {
        throw new Error('Invalid role. Please select either Host or Participant.');
      }
      const response = await axiosInstance.post('/users/register', userData);
      const { message } = response.data;
      console.log('Registration successful:', message);
      return message;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'An error occurred';
      console.error('Registration failed:', {
        status: error.response?.status,
        data: error.response?.data,
        message: errorMessage,
      });
      throw new Error(errorMessage);
    }
  };

  const resendVerificationEmail = async (email: string) => {
    try {
      const response = await axiosInstance.post('/users/resend-verification-email', { email });
      const { message } = response.data;
      console.log('Resend verification email successful:', message);
      return message;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to resend verification email';
      console.error('Resend verification failed:', errorMessage);
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    navigate('/');
  };

  return (
    <AuthContext.Provider
      value={{ user, login, register, logout, isAuthenticated, refreshToken, setUser, loading, resendVerificationEmail }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};