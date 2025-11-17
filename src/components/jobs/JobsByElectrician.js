import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../config/axios';
import { toast } from 'react-toastify';
import JobStatusBadge from './JobStatusBadge';
import './JobsByElectrician.css';

const JobsByElectrician = () => {
  const { id } = useParams();
  const [electrician, setElectrician] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchElectricianAndJobs = async () => {
    try {
      setLoading(true);
      
      // Fetch electrician details
      const electricianRes = await api.get(`/users/electricians/${id}`);
      setElectrician(electricianRes.data.data);
      
      // Fetch jobs for this electrician
      const jobsRes = await api.get(`/jobs/electrician/${id}`);
      setJobs(jobsRes.data.data);
      
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching electrician job history');
      toast.error('Error fetching electrician job history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchElectricianAndJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Filter jobs by status
  const filteredJobs = statusFilter 
    ? jobs.filter(job => job.status === statusFilter) 
    : jobs;

  // Calculate statistics
  const completedJobs = jobs.filter(job => job.status === 'Completed').length;
  const inProgressJobs = jobs.filter(job => job.status === 'In Progress').length;
  const notStartedJobs = jobs.filter(job => job.status === 'Not Started').length;

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!electrician) return <div className="error">Electrician not found</div>;

  return (
    <div className="jobs-by-electrician-container">
      <div className="electrician-header">
        <h2>Jobs Assigned to {electrician.name}</h2>
        <Link to="/electricians" className="btn btn-outline">
          <i className="fas fa-arrow-left"></i> Back to Electricians
        </Link>
      </div>
      
      <div className="electrician-info-card">
        <div className="electrician-details">
          <h3>{electrician.name}</h3>
          <p><i className="fas fa-envelope"></i> {electrician.email}</p>
          <p><i className="fas fa-phone"></i> {electrician.phone}</p>
        </div>
        <div className="job-stats">
          <div className="stat-card">
            <span className="stat-value">{jobs.length}</span>
            <span className="stat-label">Total Jobs</span>
          </div>
          <div className="stat-card completed">
            <span className="stat-value">{completedJobs}</span>
            <span className="stat-label">Completed</span>
          </div>
          <div className="stat-card in-progress">
            <span className="stat-value">{inProgressJobs}</span>
            <span className="stat-label">In Progress</span>
          </div>
          <div className="stat-card not-started">
            <span className="stat-value">{notStartedJobs}</span>
            <span className="stat-label">Not Started</span>
          </div>
        </div>
      </div>
      
      <div className="jobs-filter">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="status-filter"
        >
          <option value="">All Jobs</option>
          <option value="Not Started">Not Started</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
      </div>
      
      {filteredJobs.length === 0 ? (
        <div className="no-jobs">
          {statusFilter 
            ? `No ${statusFilter} jobs found for this electrician` 
            : 'No jobs assigned to this electrician yet'}
        </div>
      ) : (
        <div className="jobs-timeline">
          {filteredJobs.map(job => (
            <div key={job._id} className="job-timeline-item">
              <div className="timeline-status">
                <JobStatusBadge status={job.status} />
                <div className="timeline-line"></div>
              </div>
              <div className="job-timeline-card">
                <div className="timeline-header">
                  <h3>{job.title}</h3>
                  <span className="timeline-date">
                    {new Date(job.startDate).toLocaleDateString()}
                  </span>
                </div>
                <p className="job-location">
                  <i className="fas fa-map-marker-alt"></i> {job.location}
                </p>
                <p className="job-description">{job.description}</p>
                
                {job.completionDate && (
                  <div className="completion-date">
                    <i className="fas fa-flag-checkered"></i> Completed: {new Date(job.completionDate).toLocaleDateString()}
                  </div>
                )}
                
                <div className="timeline-actions">
                  <Link to={`/jobs/${job._id}`} className="btn btn-outline btn-sm">
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobsByElectrician; 