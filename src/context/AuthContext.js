import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Listen for authentication errors from our axios interceptor
  useEffect(() => {
    const handleAuthError = (event) => {
      console.log('Auth error event received:', event.detail);
      
      // Clear authentication state
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setError(event.detail.message || 'Authentication error');
      
      // Display toast notification
      // We're importing the toast directly here to avoid circular dependencies
      const toastify = require('react-toastify');
      toastify.toast.error('Your session has expired. Please log in again.');
    };
    
    window.addEventListener('auth:error', handleAuthError);
    
    return () => {
      window.removeEventListener('auth:error', handleAuthError);
    };
  }, []);  // Set axios default headers
  useEffect(() => {
    if (token) {
      console.log('Setting global Authorization header with token');
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Don't set localStorage here to avoid circular dependency
      // The token is already saved to localStorage during login
    } else {
      console.warn('No token available, removing Authorization header');
      delete axios.defaults.headers.common['Authorization'];
      // Don't remove from localStorage here, that should be done only during logout
    }
  }, [token]);  // Load user
  useEffect(() => {
    // Track API call status to prevent duplicate calls
    let isMounted = true;
    let apiCallInProgress = false;
    
    // Skip if we've already done loading or there's no token
    if (!token || !loading) {
      if (!token) {
        // Make sure loading is set to false when no token exists
        setLoading(false);
      }
      return;
    }
    
    const loadUser = async () => {
      if (apiCallInProgress) return;
      apiCallInProgress = true;
      
      try {
        // First try to load from localStorage for immediate response
        const cachedUserData = localStorage.getItem('userData');
        const lastUpdated = localStorage.getItem('userLastUpdated');
        const cacheAge = lastUpdated ? Date.now() - new Date(lastUpdated).getTime() : Infinity;
        const cacheStillFresh = cacheAge < 15 * 60 * 1000; // 15 minutes
        
        // Use cache if available for immediate display
        if (cachedUserData) {
          try {
            const initialUserData = JSON.parse(cachedUserData);
            
            if (isMounted && !user) {
              console.log('Setting user from cache');
              setUser(initialUserData);
              setIsAuthenticated(true);
              
              // If cache is fresh enough, don't make API call
              if (cacheStillFresh) {
                console.log('Cache is fresh, skipping API call');
                setLoading(false);
                return;
              }
            }
          } catch (cacheError) {
            console.error('Error parsing cached user data - will fetch from API');
          }
        }
        
        // Make API call if we have a token
        console.log('Loading fresh user data from API');
        const res = await axios.get('http://localhost:5000/api/auth/me');
        
        if (!isMounted) return;
        
        // Ensure we have both id and _id properties for compatibility
        const userData = res.data.data;
        if (userData._id && !userData.id) {
          userData.id = userData._id;
        } else if (userData.id && !userData._id) {
          userData._id = userData.id;
        }
        
        // Store in localStorage for persistence
        localStorage.setItem('userData', JSON.stringify(userData));
        localStorage.setItem('userLastUpdated', new Date().toISOString());
        
        // Update state
        setUser(userData);
        setIsAuthenticated(true);
        setError(null);
      } catch (err) {
        console.error('Error loading user:', err);
        if (!isMounted) return;
        
        // Clear auth state on error
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        setError('Authentication failed. Please log in again.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
        apiCallInProgress = false;
      }
    };    // Execute loadUser function and handle cleanup
    loadUser();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [token, user, loading]);
  // Register user
  const register = async (userData) => {
    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', userData);
      
      if (res.data.success) {
        // Ensure we have both id and _id properties for compatibility
        const user = res.data.user;
        if (user._id && !user.id) {
          user.id = user._id;
        } else if (user.id && !user._id) {
          user._id = user.id;
        }
        
        // Store both token and user data in localStorage
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('userData', JSON.stringify(user));
        
        setToken(res.data.token);
        setUser(user);
        setIsAuthenticated(true);
        setError(null);
        
        console.log('Registration successful, user data:', user);
      }
      
      return res.data;
    } catch (err) {
      console.error('Registration error:', err);
      setError(
        err.response && err.response.data.message
          ? err.response.data.message
          : 'Registration failed'
      );
      return { success: false, message: err.response?.data?.message || 'Registration failed' };
    }
  };  // Login user
  const login = async (userData) => {
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', userData);
      
      if (res.data.success && res.data.token) {
        // Make sure we have a token
        const token = res.data.token;
        
        // Ensure we have both id and _id properties for compatibility
        const user = res.data.user;
        if (user._id && !user.id) {
          user.id = user._id;
        } else if (user.id && !user._id) {
          user._id = user.id;
        }
        
        console.log('Login successful, received token');
        
        // Clear any existing cached data to prevent stale data issues
        sessionStorage.clear();
        
        // Store both token and user data in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('userData', JSON.stringify(user));
        localStorage.setItem('userLastLogin', new Date().toISOString());
        
        // Update application state
        setToken(token);
        setUser(user);
        setIsAuthenticated(true);
        setError(null);
        
        // Set token in axios defaults
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        console.log('Login successful, user data loaded');
      } else {
        console.error('Login response missing token or success flag');
        setError('Login response was invalid. Please try again.');
        return { success: false, message: 'Invalid server response' };
      }
      
      return res.data;
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.response && err.response.data.message
          ? err.response.data.message
          : 'Login failed'
      );
      return { success: false, message: err.response?.data?.message || 'Login failed' };
    }
  };  // Logout user
  const logout = () => {
    // Clear all authentication data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('userLastLogin');
    localStorage.removeItem('userLastUpdated');
    
    // Clear session data to prevent stale data issues after login
    sessionStorage.clear();
    
    // Reset authentication state
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    
    // Remove Authorization header from axios defaults
    delete axios.defaults.headers.common['Authorization'];
    
    console.log('User logged out, all data cleared');
  };

  // Update profile
  const updateProfile = async (userData) => {
    try {
      const res = await axios.put('http://localhost:5000/api/auth/updateprofile', userData);
      
      if (res.data.success) {
        setUser(res.data.data);
      }
      
      return res.data;
    } catch (err) {
      setError(
        err.response && err.response.data.message
          ? err.response.data.message
          : 'Profile update failed'
      );
      return { success: false, message: err.response.data.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        error,
        register,
        login,
        logout,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 