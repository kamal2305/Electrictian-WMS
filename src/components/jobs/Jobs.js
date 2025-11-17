import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../config/axios';
import { toast } from 'react-toastify';
import JobStatusBadge from './JobStatusBadge';
import './Jobs.css';

const Jobs = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const fetchJobs = async () => {
    try {
      let url = `/jobs?page=${currentPage}`;
      if (statusFilter) {
        url += `&status=${statusFilter}`;
      }
      const res = await api.get(url);
      setJobs(res.data.data);
      setTotalPages(res.data.totalPages);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching jobs');
      toast.error('Error fetching jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleRetry = () => {
    setError(null);
    fetchJobs();
  };

  if (loading) return <div className="loading">Loading jobs...</div>;
  
  if (error) {
    return (
      <div className="error-container">
        <div className="error">{error}</div>
        <button onClick={handleRetry} className="btn btn-primary retry-btn">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="jobs-container">
      <div className="jobs-header">
        <h2>Jobs Management</h2>
        {user && user.role === 'admin' && (
          <Link to="/jobs/create" className="btn btn-primary">
            Create New Job
          </Link>
        )}
      </div>

      <div className="jobs-filters">
        <select
          value={statusFilter}
          onChange={handleStatusChange}
          className="status-filter"
        >
          <option value="">All Status</option>
          <option value="Not Started">Not Started</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      <div className="jobs-list">
        {jobs.length === 0 ? (
          <p className="no-jobs-message">No jobs found. {user && user.role === 'admin' && 'Create your first job to get started.'}</p>
        ) : (
          jobs.map((job) => (
            <div key={job._id} className="job-card">
              <div className="job-header">
                <h3>{job.title}</h3>
                <JobStatusBadge status={job.status} />
              </div>
              <p className="job-location">
                <i className="fas fa-map-marker-alt"></i> {job.location}
              </p>
              <p className="job-description">{job.description}</p>
              <div className="job-dates">
                <span>
                  <i className="fas fa-calendar"></i> Start: {new Date(job.startDate).toLocaleDateString()}
                </span>
                {job.completionDate && (
                  <span>
                    <i className="fas fa-flag-checkered"></i> Completed: {new Date(job.completionDate).toLocaleDateString()}
                  </span>
                )}
              </div>
              <div className="job-electricians">
                <h4>Assigned Electricians:</h4>
                <div className="electrician-tags">
                  {job.assignedElectricians && job.assignedElectricians.length > 0 ? (
                    job.assignedElectricians.map((electrician) => (
                      <span key={electrician._id} className="electrician-tag">
                        {electrician.name}
                      </span>
                    ))
                  ) : (
                    <span className="no-electricians">No electricians assigned</span>
                  )}
                </div>
              </div>
              <div className="job-actions">
                <Link to={`/jobs/${job._id}`} className="btn btn-outline">
                  View Details
                </Link>
                {user && user.role === 'admin' && (
                  <Link to={`/jobs/${job._id}/edit`} className="btn btn-secondary">
                    Edit
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="btn btn-outline"
          >
            Previous
          </button>
          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="btn btn-outline"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Jobs; 