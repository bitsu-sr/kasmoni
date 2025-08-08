import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

export const AuthContext = createContext(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      
      if (storedToken) {
        try {
          const response = await authApi.getMe();
          if (response.data.success) {
            setUser(response.data.data);
            setToken(storedToken);
          } else {
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      } else {
        setToken(null);
        setUser(null);
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await authApi.login({ username, password });
      if (response.data.success && response.data.data) {
        const { token: newToken, user: userData } = response.data.data;
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(userData);
        return { success: true, user: userData };
      }
      return { success: false };
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      return { success: false };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await authApi.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
    }
  };

  const isAuthenticated = !!token && !!user;
  
  const value = {
    user,
    token,
    isAuthenticated,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
