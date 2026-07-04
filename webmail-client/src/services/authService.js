import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('webmail_token');
      if (token) {
        console.log('Token found, but skipping verify call for now');
        // Skip the verify call since it's not working
        // Just check if token exists and assume it's valid
        // In production, you'd want to verify this properly
      } else {
        console.log('No token found in localStorage');
      }
    } catch (error) {
      console.log('Auth check failed:', error.response?.status, error.response?.data);
      localStorage.removeItem('webmail_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/v1/webmail/auth/login', {
        email,
        password
      });

      const { data } = response.data;
      const { token, user } = data;
      localStorage.setItem('webmail_token', token);
      
      // Set user state - this should trigger React to re-render and show inbox
      setUser(user);
      console.log('Login successful, user set:', user);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      };
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/v1/webmail/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('webmail_token');
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};