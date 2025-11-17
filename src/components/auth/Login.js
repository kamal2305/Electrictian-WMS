import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [loading, setLoading] = useState(false);

  const { email, password } = formData;
  const { login, isAuthenticated, error } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const onSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please enter all fields');
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await login({ email, password });
      
      if (result && result.success) {
        toast.success('Login successful!');
        
        if (result.token) {
          console.log('Setting token in localStorage after successful login');
          localStorage.setItem('token', result.token);
          
          setTimeout(() => {
            navigate('/dashboard');
          }, 100);
        } else {
          console.error('Login response missing token');
          toast.error('Login response missing token');
        }
      } else {
        // ERROR #3 FIX: Always show error for failed login
        const errorMsg = result?.message || 'Invalid email or password. Please try again.';
        toast.error(errorMsg);
        console.error('Login failed with result:', result);
      }
    } catch (err) {
      // ERROR #3 FIX: Enhanced error messages for login failures
      let errorMessage = 'Login failed. Please try again.';
      
      if (err?.response?.status === 401) {
        errorMessage = 'Invalid email or password';
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      toast.error(errorMessage);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Sign In</h2>
        <p className="text-muted">Sign in to your account</p>
        
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={onChange}
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={onChange}
              placeholder="Enter your password"
              required
            />
          </div>
          
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>
            Don't have an account? <Link to="/register">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; 