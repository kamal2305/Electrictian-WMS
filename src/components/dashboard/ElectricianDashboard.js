import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/axios';
import { toast } from 'react-toastify';
import './Dashboard.css';

const ElectricianDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    activeJobs: [],
    completedJobs: [],
    totalMaterials: 0,
    hoursLogged: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [materialForm, setMaterialForm] = useState({
    name: '',
    quantity: '',
    unit: '',
    description: ''
  });  const fetchDashboardData = useCallback(async () => {
    // Don't attempt to fetch data if user or user ID isn't available
    if (!user || !user.id) {
      console.log('User or user ID not available yet, waiting...');
      setLoading(true);
      return;
    }
    
    // Prevent excessive API calls by checking if we've fetched recently
    const lastFetchTime = sessionStorage.getItem('lastElectricianDashboardFetch');
    if (lastFetchTime && (Date.now() - parseInt(lastFetchTime) < 30000)) { // 30 seconds
      console.log('Skipping fetch - data was requested recently');
      const cachedData = sessionStorage.getItem(`electricianDashboardData_${user.id}`);
      if (cachedData) {
        try {
          setDashboardData(JSON.parse(cachedData));
          setLoading(false);
          return;
        } catch (error) {
          console.error('Error parsing cached dashboard data:', error);
          // Continue with fetch if parse fails
        }
      }
    }
    
    console.log('Fetching dashboard data for electrician ID:', user.id);
    
    try {
      setLoading(true);
      const response = await api.get(`/dashboard/electrician/${user.id}/stats`);
      if (response.data && response.data.success && response.data.data) {
        console.log('Dashboard data received');
        
        // Only call repair endpoint once per session, and only if needed
        if (!window.materialRepairCalled && !sessionStorage.getItem('materialRepairCompleted')) {
          console.log('Verifying material usage data integrity...');
          try {
            window.materialRepairCalled = true;
            // Call repair endpoint for data verification and potential repair
            const repairResponse = await api.post(`/dashboard/electrician/${user.id}/repair-materials`);
            if (repairResponse.data && repairResponse.data.success) {
              console.log('Material usage data verification complete');
              sessionStorage.setItem('materialRepairCompleted', 'true');
              
              // Always use the repaired material count, which should be more reliable
              if (repairResponse.data.data && repairResponse.data.data.totalMaterials !== undefined) {
                console.log('Updated total materials count');
                response.data.data.totalMaterials = repairResponse.data.data.totalMaterials;
              }
            }
          } catch (repairError) {
            console.error('Error verifying material usage data');
            // Continue with original count if verification fails
          }
        }
          const dashboardData = {
          activeJobs: response.data.data.activeJobs || [],
          completedJobs: response.data.data.completedJobs || [],
          totalMaterials: response.data.data.totalMaterials || 0,
          hoursLogged: response.data.data.hoursLogged || 0
        };
        
        // Store the dashboard data in sessionStorage for later use
        try {
          sessionStorage.setItem(`electricianDashboardData_${user.id}`, JSON.stringify(dashboardData));
          sessionStorage.setItem('lastDashboardFetch', new Date().getTime().toString());
        } catch (error) {
          console.error('Error storing dashboard data in sessionStorage:', error);
        }
        
        setDashboardData(dashboardData);
      } else {
        console.log('Response successful but no data found');
        setDashboardData({
          activeJobs: [],
          completedJobs: [],
          totalMaterials: 0,
          hoursLogged: 0
        });
      }
    } catch (error) {
      console.error('Dashboard data error:', error);
      toast.error('Error fetching dashboard data');
    } finally {
      setLoading(false);
    }
  }, [user]);  useEffect(() => {
    // Track if the component is mounted
    let isMounted = true;
    
    // Only fetch dashboard data if user is loaded and authenticated
    if (user && user.id) {
      console.log('User loaded, checking for dashboard data...', user.id);
      
      // Try to get cached dashboard data first
      const cachedDashboardData = sessionStorage.getItem(`electricianDashboardData_${user.id}`);
      const lastFetch = sessionStorage.getItem('lastElectricianDashboardFetch');
      const cacheAge = lastFetch ? Date.now() - Number(lastFetch) : Infinity;
      const cacheFresh = cacheAge < 60000; // 1 minute
      
      if (cachedDashboardData && cacheFresh) {
        try {
          const parsedData = JSON.parse(cachedDashboardData);
          console.log('Using cached dashboard data');
          setDashboardData(parsedData);
          setLoading(false);
        } catch (error) {
          console.error('Error parsing cached dashboard data:', error);
          // If there's an error parsing the cached data, fetch fresh data
          fetchDashboardData();
        }
      } else {
        // No cached data, fetch fresh data
        fetchDashboardData();
      }
    } else {
      console.log('User not loaded yet, checking localStorage...');
      
      // Try to get user data from localStorage as backup
      const cachedUser = localStorage.getItem('userData');
      if (cachedUser) {
        try {
          const parsedUser = JSON.parse(cachedUser);
          if (parsedUser && parsedUser.id && isMounted) {
            console.log('Using cached user data for dashboard fetch:', parsedUser.id);
            // Temporarily set the user data for the API call
            setDashboardData(prev => ({...prev, loading: true}));
            api.get(`/dashboard/electrician/${parsedUser.id}/stats`)
              .then(response => {
                if (response.data && response.data.success && response.data.data && isMounted) {
                  console.log('Dashboard data received from cached user:', response.data.data);
                  setDashboardData({
                    activeJobs: response.data.data.activeJobs || [],
                    completedJobs: response.data.data.completedJobs || [],
                    totalMaterials: response.data.data.totalMaterials || 0,
                    hoursLogged: response.data.data.hoursLogged || 0
                  });
                }
                if (isMounted) setLoading(false);
              })
              .catch(err => {
                console.error('Error fetching with cached credentials:', err);
                if (isMounted) setLoading(false);
              });
          }
        } catch (err) {
          console.error('Error parsing cached user data', err);
        }
      } else {
        console.log('No cached user data found, waiting for auth context');
      }
    }
    
    // Cleanup function to prevent memory leaks and state updates after unmount
    return () => {
      isMounted = false;
      console.log('Dashboard component unmounted, cleanup performed');
    };
  }, [fetchDashboardData, user]);const handleMaterialSubmit = async (e) => {
    e.preventDefault();
    if (!selectedJob) {
      toast.error('Please select a job first');
      return;
    }    // Enhanced validation of the form data before submission
    // Ensure quantity is a valid positive number
    const quantity = parseFloat(materialForm.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error('Please enter a valid positive quantity');
      return;
    }

    if (!materialForm.name || !materialForm.name.trim()) {
      toast.error('Please enter a material name');
      return;
    }

    if (!materialForm.unit || !materialForm.unit.trim()) {
      toast.error('Please enter a unit of measurement');
      return;
    }
      try {
      // Prepare data with valid numeric quantity - ensure all required fields are present
      const materialData = {
        name: materialForm.name.trim(),
        quantity: quantity, // Send as a number, not a string
        unit: materialForm.unit.trim(),
        description: materialForm.description,
        job: selectedJob._id, // Explicitly include job ID
        addedBy: user.id
      };
      
      console.log('Submitting material with data:', materialData);
      
      // First, create the material
      const materialResponse = await api.post(`/jobs/${selectedJob._id}/materials`, materialData);
        if (materialResponse.data && materialResponse.data.success) {
        // Material created successfully, now create the material usage record
        console.log('Material created with ID:', materialResponse.data.data._id);
        
        // Then create a material usage record to track this electrician's usage
        try {
          // Prepare usage data with all required fields
          const usageData = {
            materialId: materialResponse.data.data._id,
            electricianId: user.id,
            quantity: quantity, // Send as a number, not a string
            notes: materialForm.description || 'Added from dashboard'
          };
          
          console.log('Creating material usage with data:', usageData);
          const usageResponse = await api.post(`/jobs/${selectedJob._id}/material-usage`, usageData);
          
          console.log('Material usage created successfully:', usageResponse.data);
        } catch (usageError) {
          console.error('Error adding material usage record:', usageError);
          
          if (usageError.response && usageError.response.data) {
            console.error('Error response details:', usageError.response.data);
          }
          
          // Continue even if this fails, as the material was still created
          toast.warning('Material added but usage tracking had an error');
        }

        toast.success('Material added successfully');
        setMaterialForm({
          name: '',
          quantity: '',
          unit: '',
          description: ''
        });
        
        // Reload dashboard data to reflect new material usage
        fetchDashboardData();
      }    } catch (error) {
      console.error('Error adding material:', error);
      
      // Enhanced error logging to help diagnose issues
      if (error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response data:', error.response.data);
        
        // Provide more specific error messages based on the response
        if (error.response.status === 400) {
          // Handle validation errors
          const message = error.response.data.message;
          if (Array.isArray(message)) {
            // If validation returned multiple errors, show them all
            message.forEach(msg => toast.error(msg));
          } else {
            toast.error(`Validation Error: ${message || 'Please check your inputs'}`);
          }
        } else if (error.response.status === 404) {
          toast.error('Resource not found. The job may have been deleted.');
        } else if (error.response.status === 403) {
          toast.error('Not authorized to add materials to this job.');
        } else {
          // Generic error with the message from the server
          toast.error(`Error: ${error.response.data.message || 'Something went wrong'}`);
        }
      } else if (error.request) {
        // Request was made but no response was received
        toast.error('No response from server. Please check your connection and try again.');
      } else {
        // Generic error handling
        toast.error('Error adding material. Please check your inputs and try again.');
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome, {user.name}</h1>
        <p>Your Electrician Dashboard</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Active Jobs</h3>
          <div className="stat-value">{dashboardData.activeJobs?.length || 0}</div>
        </div>
        <div className="stat-card">
          <h3>Completed Jobs</h3>
          <div className="stat-value">{dashboardData.completedJobs?.length || 0}</div>
        </div>
        <div className="stat-card">
          <h3>Materials Used</h3>
          <div className="stat-value">{dashboardData.totalMaterials}</div>
        </div>
        <div className="stat-card">
          <h3>Hours Logged</h3>
          <div className="stat-value">{dashboardData.hoursLogged}</div>
        </div>
      </div>

      <div className="jobs-section">
        <h2>Your Active Jobs</h2>
        <div className="jobs-grid">
          {dashboardData.activeJobs && dashboardData.activeJobs.length > 0 ? (
            dashboardData.activeJobs.map(job => (
              <div 
                key={job._id} 
                className={`job-card ${selectedJob?._id === job._id ? 'selected' : ''}`}
                onClick={() => setSelectedJob(job)}
              >
                <h3>{job.title}</h3>
                <p className="job-location">{job.location}</p>
                <p className="job-date">Due: {new Date(job.dueDate).toLocaleDateString()}</p>
                <div className="job-status">
                  <span className={`status-badge ${job.status.toLowerCase()}`}>
                    {job.status}
                  </span>
                </div>
                <Link to={`/jobs/${job._id}`} className="view-details">
                  View Details
                </Link>
              </div>
            ))
          ) : (
            <p className="no-jobs">No active jobs found</p>
          )}
        </div>
      </div>

      {selectedJob && (
        <div className="material-section">
          <h2>Add Materials for {selectedJob.title}</h2>          <form onSubmit={handleMaterialSubmit} className="material-form">
            <div className="form-group">
              <label>Material Name</label>
              <input
                type="text"
                placeholder="e.g., Wire, Cable, Outlet"
                value={materialForm.name}
                onChange={(e) => setMaterialForm({...materialForm, name: e.target.value})}
                required
              />
            </div>
            <div className="form-row">              <div className="form-group">
                <label>Quantity</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Enter quantity (e.g., 5.5)"
                  value={materialForm.quantity}
                  onChange={(e) => setMaterialForm({...materialForm, quantity: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Unit</label>
                <input
                  type="text"
                  placeholder="e.g., meters, pieces, kg"
                  value={materialForm.unit}
                  onChange={(e) => setMaterialForm({...materialForm, unit: e.target.value})}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={materialForm.description}
                onChange={(e) => setMaterialForm({...materialForm, description: e.target.value})}
              />
            </div>
            <button type="submit" className="submit-button">
              Add Material
            </button>
          </form>
        </div>
      )}

      <div className="completed-jobs-section">
        <h2>Recently Completed Jobs</h2>
        <div className="completed-jobs-grid">
          {dashboardData.completedJobs && dashboardData.completedJobs.length > 0 ? (
            dashboardData.completedJobs.slice(0, 3).map(job => (
              <div key={job._id} className="completed-job-card">
                <h3>{job.title}</h3>
                <p className="job-location">{job.location}</p>
                <p className="completion-date">
                  Completed: {new Date(job.completedAt).toLocaleDateString()}
                </p>
                <Link to={`/jobs/${job._id}`} className="view-details">
                  View Details
                </Link>
              </div>
            ))
          ) : (
            <p className="no-jobs">No completed jobs found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ElectricianDashboard; 