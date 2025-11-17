import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../config/axios';
import { toast } from 'react-toastify';
import JobStatusBadge from './JobStatusBadge';
import './ElectricianJobs.css';

const ElectricianJobs = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusForm, setStatusForm] = useState({
    status: '',
    notes: ''
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await api.get('/jobs/electrician/current');
      setJobs(response.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching jobs');
      toast.error('Error fetching jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusClick = (job) => {
    setSelectedJob(job);
    setStatusForm({ status: job.status, notes: '' });
    setShowStatusModal(true);
  };

  const handleStatusChange = async (e) => {
    e.preventDefault();
    if (!selectedJob || !statusForm.status) return;

    try {
      setUpdatingStatus(true);
      await api.put(`/jobs/${selectedJob._id}/status`, statusForm);
      
      // Update the job in the local state
      setJobs(jobs.map(job => 
        job._id === selectedJob._id 
          ? { ...job, status: statusForm.status }
          : job
      ));

      toast.success('Job status updated successfully');
      setShowStatusModal(false);
      setSelectedJob(null);
      setStatusForm({ status: '', notes: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating job status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="electrician-jobs-container">
      <h2>My Jobs</h2>
      
      <div className="jobs-grid">
        {jobs.map((job) => (
          <div key={job._id} className="job-card">
            <div className="job-header">
              <h3>{job.title}</h3>
              <JobStatusBadge status={job.status} />
            </div>
            
            <div className="job-details">
              <p className="job-location">
                <i className="fas fa-map-marker-alt"></i> {job.location}
              </p>
              <p className="job-description">{job.description}</p>
              <p className="job-date">
                <i className="fas fa-calendar"></i> Started: {new Date(job.startDate).toLocaleDateString()}
              </p>
              {job.completionDate && (
                <p className="job-date">
                  <i className="fas fa-flag-checkered"></i> Completed: {new Date(job.completionDate).toLocaleDateString()}
                </p>
              )}
            </div>

            <div className="job-actions">
              <button 
                className="btn btn-primary"
                onClick={() => handleStatusClick(job)}
              >
                Update Status
              </button>
            </div>
          </div>
        ))}
      </div>

      {showStatusModal && selectedJob && (
        <div className="modal">
          <div className="modal-content">
            <h3>Update Job Status</h3>
            <form onSubmit={handleStatusChange}>
              <div className="form-group">
                <label>Current Status: <JobStatusBadge status={selectedJob.status} /></label>
              </div>
              
              <div className="form-group">
                <label>New Status:</label>
                <select
                  value={statusForm.status}
                  onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                  required
                >
                  <option value="">Select Status</option>
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="form-group">
                <label>Notes:</label>
                <textarea
                  value={statusForm.notes}
                  onChange={(e) => setStatusForm({ ...statusForm, notes: e.target.value })}
                  placeholder="Add any notes about the status change"
                  rows="3"
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowStatusModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={updatingStatus}
                >
                  {updatingStatus ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ElectricianJobs; 