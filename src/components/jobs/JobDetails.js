import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';
import api from '../../config/axios';
import JobStatusBadge from './JobStatusBadge';
import TimeLogButton from '../timelogs/TimeLogButton';
import TimeLogList from '../timelogs/TimeLogList';
import MaterialForm from '../materials/MaterialForm';
import MaterialList from '../materials/MaterialList';
import './JobDetails.css';

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  const fetchJobDetails = useCallback(async () => {
    try {
      const res = await api.get(`/jobs/${id}`);
      setJob(res.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching job details');
      toast.error('Error fetching job details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchJobDetails();
  }, [fetchJobDetails]);

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      await api.put(`/jobs/${id}/status`, {
        status: newStatus
      });
      fetchJobDetails();
      toast.success('Job status updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating job status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this job?')) {
      return;
    }

    try {
      await api.delete(`/jobs/${id}`);
      toast.success('Job deleted successfully');
      navigate('/jobs');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting job');
    }
  };
  const handleMaterialAdded = (newMaterial) => {
    toast.success('Material added successfully');
    // Refresh job details to update materials count
    fetchJobDetails();
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!job) return <div className="error">Job not found</div>;

  const canUpdateStatus = user.role === 'admin' || 
    job.assignedElectricians.some(e => e._id === user.id);

  // Check if the current user is an electrician assigned to this job
  const isAssignedElectrician = 
    user.role === 'electrician' && 
    job.assignedElectricians.some(e => e._id === user.id);

  return (
    <div className="job-details-container">
      <div className="job-details-header">
        <div className="title-section">
          <h2>{job.title}</h2>
          <JobStatusBadge status={job.status} />
        </div>        <div className="action-buttons">
          {user.role === 'admin' && (
            <>
              <Link to={`/jobs/${id}/edit`} className="btn btn-secondary">
                Edit Job
              </Link>
              {job.status === 'Completed' && (
                <Link 
                  to={`/invoices/create`} 
                  state={{ jobId: job._id }} 
                  className="btn btn-success"
                >
                  Generate Invoice
                </Link>
              )}
              <button onClick={handleDelete} className="btn btn-danger">
                Delete Job
              </button>
            </>
          )}
        </div>
      </div>

      <div className="job-details-content">
        <div className="job-info">
          <div className="info-section">
            <h3>Job Details</h3>
            <p><strong>Description:</strong> {job.description}</p>
            <p><strong>Location:</strong> {job.location}</p>
            <p><strong>Start Date:</strong> {new Date(job.startDate).toLocaleDateString()}</p>
            {job.completionDate && (
              <p><strong>Completion Date:</strong> {new Date(job.completionDate).toLocaleDateString()}</p>
            )}
          </div>

          <div className="assigned-electricians">
            <h3>Assigned Electricians</h3>
            <ul>
              {job.assignedElectricians.map(electrician => (
                <li key={electrician._id}>
                  {electrician.name} ({electrician.email})
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="job-actions">
          {canUpdateStatus && (
            <div className="status-update">
              <h3>Update Status</h3>
              <select
                value={job.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updatingStatus}
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          )}

          {isAssignedElectrician && (
            <TimeLogButton jobId={id} />
          )}
        </div>

        <div className="job-tabs">
          <div className="tab-buttons">
            <button
              className={activeTab === 'details' ? 'active' : ''}
              onClick={() => setActiveTab('details')}
            >
              Details
            </button>
            <button
              className={activeTab === 'timelogs' ? 'active' : ''}
              onClick={() => setActiveTab('timelogs')}
            >
              Time Logs
            </button>
            <button
              className={activeTab === 'materials' ? 'active' : ''}
              onClick={() => setActiveTab('materials')}
            >
              Materials
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'timelogs' && <TimeLogList jobId={id} />}
            {activeTab === 'materials' && (
              <>
                {isAssignedElectrician && (
                  <MaterialForm jobId={id} onMaterialAdded={handleMaterialAdded} />
                )}
                <MaterialList jobId={id} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetails; 