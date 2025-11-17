import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/axios';
import { toast } from 'react-toastify';
import './Dashboard.css';
import { Chart, Filler } from 'chart.js';
Chart.register(Filler);

const AdminDashboard = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    totalJobs: 0,
    activeJobs: 0,
    completedJobs: 0,
    totalElectricians: 0,
    totalMaterials: 0,
    recentJobs: [],
    electricianPerformance: []
  });
  const [loading, setLoading] = useState(true);
  const [tokenError, setTokenError] = useState(false);

  // Fetch dashboard data with proper error handling
  const fetchDashboardData = useCallback(async (isMounted = true) => {
    try {
      setLoading(true);
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No authentication token found in localStorage');
        if (isMounted) {
          setTokenError(true);
          toast.error('Authentication token not found. Please log in again.');
        }
        return;
      }
      
      console.log('Fetching dashboard data with token:', token.substring(0, 10) + '...');
      
      const response = await api.get('/dashboard/stats');
      
      if (response.data.success) {
        if (isMounted) {
          // Store dashboard data in sessionStorage for later use
          try {
            sessionStorage.setItem('adminDashboardData', JSON.stringify(response.data.data));
            sessionStorage.setItem('lastAdminDashboardFetch', new Date().getTime().toString());
          } catch (storageError) {
            console.error('Error storing dashboard data in sessionStorage:', storageError);
          }
          
          setDashboardData(response.data.data);
          setTokenError(false);
        }
      } else {
        if (isMounted) {
          toast.error('Error fetching dashboard data: ' + (response.data.message || 'Unknown error'));
        }
      }
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      
      if (error.response && error.response.status === 401) {
        console.error('Authentication error when fetching dashboard data');
        if (isMounted) {
          setTokenError(true);
          toast.error('Your session has expired. Please log in again.');
        }
      } else {
        if (isMounted) {
          toast.error('Failed to load dashboard data. Please try again later.');
        }
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  }, []);

  // ERROR #4 FIX: Listen for custom event to refresh dashboard stats
  useEffect(() => {
    const handleRefreshDashboard = () => {
      console.log('Dashboard refresh event received');
      fetchDashboardData(true);
    };
    
    window.addEventListener('refreshDashboard', handleRefreshDashboard);
    
    return () => {
      window.removeEventListener('refreshDashboard', handleRefreshDashboard);
    };
  }, [fetchDashboardData]);

  // Check for cached data or fetch fresh data when component mounts
  useEffect(() => {
    let isMounted = true;
    
    // If authentication is still loading, wait
    if (authLoading) {
      console.log('Auth still loading, waiting...');
      return;
    }
    
    // If user is not authenticated or token error occurred, redirect to login
    if (!isAuthenticated || tokenError) {
      console.log('User not authenticated or token error, redirecting to login');
      navigate('/login');
      return;
    }
    
    // Try to get cached dashboard data first
    const cachedDashboardData = sessionStorage.getItem('adminDashboardData');
    const lastFetch = sessionStorage.getItem('lastAdminDashboardFetch');
    const cacheAge = lastFetch ? Date.now() - Number(lastFetch) : Infinity;
    const cacheFresh = cacheAge < 5 * 60 * 1000; // 5 minutes
    
    if (cachedDashboardData && cacheFresh) {
      try {
        const parsedData = JSON.parse(cachedDashboardData);
        console.log('Using cached admin dashboard data');
        setDashboardData(parsedData);
        setLoading(false);
      } catch (parseError) {
        console.error('Error parsing cached dashboard data:', parseError);
        fetchDashboardData(isMounted);
      }
    } else {
      console.log('No fresh cache available, fetching new dashboard data');
      fetchDashboardData(isMounted);
    }
    
    return () => {
      isMounted = false;
      console.log('Admin dashboard component unmounted, cleanup performed');
    };
  }, [isAuthenticated, authLoading, tokenError, navigate, fetchDashboardData]);  // Reload data on visibility change (user returns to tab)
  useEffect(() => {
    // Keep track of last refresh time to prevent frequent refreshes
    let lastRefreshTime = Date.now();
    const REFRESH_INTERVAL = 60000; // 1 minute minimum between refreshes
    
    const handleVisibilityChange = () => {
      const now = Date.now();
      if (document.visibilityState === 'visible' && isAuthenticated && 
          (now - lastRefreshTime > REFRESH_INTERVAL)) {
        console.log('Tab became visible, refreshing dashboard data');
        lastRefreshTime = now;
        fetchDashboardData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, fetchDashboardData]);

  if (authLoading || loading) {
    return (
      <div className="loading-container">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="error-container">
        <div className="error-message">
          Authentication error. Redirecting to login page...
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome, {user?.name || 'Admin'}</h1>
        <p>Admin Dashboard</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Jobs</h3>
          <div className="stat-value">{dashboardData.totalJobs}</div>
          <div className="stat-label">
            {dashboardData.activeJobs} Active • {dashboardData.completedJobs} Completed
          </div>
        </div>
        <div className="stat-card">
          <h3>Electricians</h3>
          <div className="stat-value">{dashboardData.totalElectricians}</div>
          <div className="stat-label">Total Team Members</div>
        </div>
        <div className="stat-card">
          <h3>Materials</h3>
          <div className="stat-value">{dashboardData.totalMaterials}</div>
          <div className="stat-label">Items in Inventory</div>
        </div>
        <div className="stat-card">
          <h3>Completion Rate</h3>
          <div className="stat-value">
            {dashboardData.totalJobs ? Math.round((dashboardData.completedJobs / dashboardData.totalJobs) * 100) : 0}%
          </div>
          <div className="stat-label">Job Success Rate</div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="quick-actions">          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <Link to="/jobs/create" className="action-button">
              Create New Job
            </Link>
            <Link to="/electricians/create" className="action-button">
              Add Electrician
            </Link>
            <Link to="/materials/create" className="action-button">
              Add Materials
            </Link>
            <Link to="/invoices/create" className="action-button">
              Generate Invoice
            </Link>
            <Link to="/reports/attendance" className="action-button">
              Attendance Report
            </Link>
            <Link to="/invoices" className="action-button">
              Manage Invoices
            </Link>
            <Link to="/analytics" className="action-button">
              View Analytics
            </Link>
          </div>
        </div>      <div className="recent-jobs">
          <h2>Recent Jobs</h2>
          {dashboardData.recentJobs && dashboardData.recentJobs.length > 0 ? (
            <div className="jobs-grid">
              {dashboardData.recentJobs.map(job => (
                <div key={job._id} className="job-card">
                  <h3>{job.title}</h3>
                  <p className="job-location">{job.location}</p>
                  <p className="job-date">Due: {new Date(job.startDate).toLocaleDateString()}</p>
                  <div className="job-status">
                    <span className={`status-badge ${job.status.toLowerCase().replace(' ', '-')}`}>
                      {job.status}
                    </span>
                  </div>
                  <div className="job-assignee">
                    Assigned to: {job.assignedElectricians?.map(e => e.name).join(', ') || 'Unassigned'}
                  </div>
                  <Link to={`/jobs/${job._id}`} className="view-details">
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data">No recent jobs found</div>
          )}
        </div>

        <div className="performance-section">
          <h2>Top Performing Electricians</h2>
          {dashboardData.electricianPerformance && dashboardData.electricianPerformance.length > 0 ? (
            <div className="performers-list">
              {dashboardData.electricianPerformance.map((electrician, index) => (
                <div key={electrician._id} className="performer-card">
                  <div className="rank">#{index + 1}</div>
                  <div className="name">{electrician.name}</div>
                  <div className="stats">
                    <div className="stat-item">
                      <span className="label">Completed Jobs:</span>
                      <span className="value">{electrician.completedJobs}</span>
                    </div>
                    <div className="stat-item">
                      <span className="label">Success Rate:</span>
                      <span className="value">{Math.round(electrician.successRate)}%</span>
                    </div>
                  </div>
                  <Link 
                    to={`/jobs/electrician/${electrician._id}`} 
                    className="view-details"
                  >
                    View Jobs
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data">No electrician performance data available</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 