import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="home-container">
      <div className="home-hero">
        <h1>Electrician Work Management System</h1>
        <p>Streamline operations, track materials, and manage electrician activities efficiently</p>
        
        {!isAuthenticated ? (
          <div className="home-buttons">
            <Link to="register" className="btn btn-primary">
              Get Started
            </Link>
            <Link to="login" className="btn btn-outline">
              Sign In
            </Link>
          </div>
        ) : (
          <div className="home-buttons">
            <Link to="dashboard" className="btn btn-primary">
              Go to Dashboard
            </Link>
          </div>
        )}
      </div>
      
      <div className="home-features">
        <h2>Key Features</h2>
        
        <div className="features-grid">
          <div className="feature-card">
            <i className="fas fa-users"></i>
            <h3>Role-Based Access</h3>
            <p>Secure access control based on user roles</p>
          </div>
          
          <div className="feature-card">
            <i className="fas fa-clock"></i>
            <h3>Real-Time Work Logging</h3>
            <p>Track work hours and activities in real-time</p>
          </div>
          
          <div className="feature-card">
            <i className="fas fa-chart-bar"></i>
            <h3>Visual Analytics</h3>
            <p>Comprehensive reports and visual analytics</p>
          </div>
          
          <div className="feature-card">
            <i className="fas fa-file-invoice-dollar"></i>
            <h3>Automated Billing</h3>
            <p>Streamlined invoicing and billing processes</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 