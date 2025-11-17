import axios from 'axios';

// List of potential backend API ports
const API_PORTS = [5000, 5001, 5002, 5003, 5100, 5200];

// Initialize port from localStorage or default to 5000
const getPort = () => {
  const savedPort = localStorage.getItem('apiPort');
  if (savedPort && !isNaN(Number(savedPort))) {
    console.log(`Using saved API port from localStorage: ${savedPort}`);
    return Number(savedPort);
  }
  return 5000; // Default port if not found in localStorage
};

// Function to get the current base URL
const getBaseURL = () => `http://localhost:${getPort()}/api`;

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  (config) => {
    // Get the token from localStorage each time to ensure it's current
    const token = localStorage.getItem('token');
    
    // Always set Authorization header if token exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`Setting Authorization header for ${config.method?.toUpperCase() || 'REQUEST'} to ${config.url}`);
    } else {
      // Check if we're trying to access a protected route without a token
      const protectedRoutes = ['/dashboard', '/jobs', '/materials', '/users', '/timelogs', '/auth/me'];
      const isProtectedRoute = protectedRoutes.some(route => config.url?.includes(route));
      
      if (isProtectedRoute) {
        console.warn(`Warning: Attempting to access potentially protected route ${config.url} without authentication token`);
      }
    }
      // Always use the current baseURL
    config.baseURL = getBaseURL();
      // Only add cache-busting timestamp for specific API endpoints that need it
    // This prevents unnecessary reloads for all requests
    const cacheBustingEndpoints = ['/dashboard/stats', '/analytics'];
    if (config.method === 'get' && cacheBustingEndpoints.some(endpoint => config.url?.includes(endpoint))) {
      config.params = {
        ...config.params,
        _t: Date.now() // Use current timestamp for real-time data
      };
    }
    
    return config;
  }, 
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle connection errors
api.interceptors.response.use(
  (response) => {
    // Only log in development - reduce console noise
    if (process.env.NODE_ENV === 'development') {
      console.log(`API call to ${response.config.url} successful`);
    }
    return response;
  },
  async (error) => {
    // Track API error count to prevent excessive event dispatching
    const lastAuthErrorTime = window._lastAuthErrorTime || 0;
    const now = Date.now();
    const AUTH_ERROR_THROTTLE = 10000; // Only show auth errors once per 10 seconds
    
    // Handle 401 Unauthorized errors specially
    if (error.response && error.response.status === 401) {
      console.error(`Authentication error (401) for ${error.config.url}`);
      
      // Check if token exists but is invalid/expired
      const token = localStorage.getItem('token');
      if (token) {
        console.warn('Token exists but rejected by server');
        
        // Remove the invalid token
        localStorage.removeItem('token');
        
        // Only dispatch auth error event if we haven't done so recently
        if (now - lastAuthErrorTime > AUTH_ERROR_THROTTLE) {
          window._lastAuthErrorTime = now;
          
          // Dispatch a custom event that AuthContext will listen for
          const authErrorEvent = new CustomEvent('auth:error', { 
            detail: { 
              message: 'Your session has expired. Please log in again.', 
              status: 401,
              time: now
            } 
          });
          window.dispatchEvent(authErrorEvent);
        }
      }
      
      // Don't try other ports for authentication errors - it's not a connection issue
      return Promise.reject(error);
    }
      // If the error is due to server connection issues (network error)
    if (error.message === 'Network Error' || !error.response) {
      console.warn(`Network error connecting to ${error.config?.url || 'API'}`);
      
      // Try to find an active port
      const findActivePort = async () => {
        for (const port of API_PORTS) {
          if (port === getPort()) continue; // Skip the current port that just failed
          
          try {
            console.log(`Trying to connect using port ${port}...`);
            const response = await axios.get(`http://localhost:${port}/api/diagnostics/status`, { 
              timeout: 1000 
            });
            
            if (response.status < 500) { // Any response that's not a server error
              console.log(`Found working API on port ${port}`);
              localStorage.setItem('apiPort', port);
              return port;
            }
          } catch (err) {
            if (err.response) {
              // If we get any response, the server is running
              console.log(`Found active API on port ${port} with status ${err.response.status}`);
              localStorage.setItem('apiPort', port);
              return port;
            }
          }
        }
        return null;
      };
      
      try {
        const newPort = await findActivePort();
        
        if (newPort) {
          // Retry the request with the new port
          const retryConfig = {...error.config};
          retryConfig.baseURL = `http://localhost:${newPort}/api`;
          
          console.log(`Retrying request with new port ${newPort}`);
          return await axios(retryConfig);
        } else {
          console.error('All backend ports tried and failed. Server might be down.');
        }
      } catch (retryError) {
        console.error('Error during port discovery:', retryError);
      }
    }

    return Promise.reject(error);
  }
);

export default api; 