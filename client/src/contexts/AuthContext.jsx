import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/auth';
import { STORAGE_KEYS, ROLES } from '../utils/constants';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth data on mount
    const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER);

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      // Verify token is still valid by fetching user profile
      authAPI.getMe()
        .then((userData) => {
          // Update user data if needed
          if (userData) {
            setUser(userData);
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
          }
        })
        .catch(() => {
          // Token invalid, logout
          logout();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      
      // API now returns { user, token } directly
      const newToken = response.token;
      const userData = response.user;
      
      if (!newToken || !userData) {
        throw new Error('Invalid response from server');
      }
      
      setToken(newToken);
      setUser(userData);
      localStorage.setItem(STORAGE_KEYS.TOKEN, newToken);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle different error formats
      let errorMessage = 'Login failed. Please check your credentials and try again.';
      
      if (error.response) {
        // Server responded with error
        errorMessage = 
          error.response.data?.message || 
          error.response.data?.error ||
          error.response.data?.msg ||
          `Server error: ${error.response.status} ${error.response.statusText}`;
      } else if (error.request) {
        // Request made but no response
        errorMessage = 'Cannot connect to server. Please check if the backend is running and VITE_API_URL is correct.';
      } else {
        // Error in request setup
        errorMessage = error.message || errorMessage;
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const signup = async (userData) => {
    try {
      const response = await authAPI.signup(userData);
      
      // API now returns { user, token } directly
      const newToken = response.token;
      const newUser = response.user;
      
      if (!newToken || !newUser) {
        throw new Error('Invalid response from server');
      }
      
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem(STORAGE_KEYS.TOKEN, newToken);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
      
      return { success: true };
    } catch (error) {
      console.error('Signup error:', error);
      
      // Handle different error formats
      let errorMessage = 'Signup failed. Please check your information and try again.';
      
      if (error.response) {
        // Server responded with error
        errorMessage = 
          error.response.data?.message || 
          error.response.data?.error ||
          error.response.data?.msg ||
          `Server error: ${error.response.status} ${error.response.statusText}`;
      } else if (error.request) {
        // Request made but no response
        errorMessage = 'Cannot connect to server. Please check if the backend is running and VITE_API_URL is correct.';
      } else {
        // Error in request setup
        errorMessage = error.message || errorMessage;
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  };

  const isAuthenticated = () => {
    return !!token && !!user;
  };

  const hasRole = (role) => {
    return user?.role === role;
  };

  const isInventoryManager = () => {
    return hasRole(ROLES.INVENTORY_MANAGER);
  };

  const isWarehouseStaff = () => {
    return hasRole(ROLES.WAREHOUSE_STAFF);
  };

  const value = {
    user,
    token,
    loading,
    login,
    signup,
    logout,
    isAuthenticated,
    hasRole,
    isInventoryManager,
    isWarehouseStaff,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

