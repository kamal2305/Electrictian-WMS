import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../config/axios';
import { toast } from 'react-toastify';
import './JobForm.css';

const JobForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    startDate: '',
    status: 'Not Started',
    assignedElectricians: []
  });

  const [electricians, setElectricians] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchElectricians = async () => {
    try {
      const res = await api.get('/users/electricians');
      setElectricians(res.data.data);
    } catch (err) {
      setError('Error fetching electricians');
      toast.error('Error fetching electricians');
    }
  };

  const fetchJobDetails = async () => {
    try {
      const res = await api.get(`/jobs/${id}`);
      const job = res.data.data;
      setFormData({
        title: job.title,
        description: job.description,
        location: job.location,
        startDate: new Date(job.startDate).toISOString().split('T')[0],
        status: job.status,
        assignedElectricians: job.assignedElectricians.map(e => e._id)
      });
    } catch (err) {
      setError('Error fetching job details');
      toast.error('Error fetching job details');
      navigate('/jobs');
    }
  };

  useEffect(() => {
    fetchElectricians();
    if (isEditMode) {
      fetchJobDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`Field changed: ${name} = ${value}`); // DEBUG: Log field changes
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleElectricianChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({
      ...prev,
      assignedElectricians: selectedOptions
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // ERROR #1 FIX: Validate startDate before submission
    console.log('Form data before validation:', formData); // DEBUG
    console.log('Start date value:', formData.startDate, 'Type:', typeof formData.startDate); // DEBUG
    
    if (!formData.startDate || formData.startDate.trim() === '') {
      toast.error('Please select a start date');
      setError('Start date is required');
      setLoading(false);
      return;
    }

    console.log('Submitting job with data:', formData);

    try {
      if (isEditMode) {
        await api.put(`/jobs/${id}`, formData);
        toast.success('Job updated successfully!');
      } else {
        await api.post('/jobs', formData);
        toast.success('Job created successfully!');
        
        // ERROR #4 FIX: Trigger dashboard refresh after creating new job
        window.dispatchEvent(new Event('refreshDashboard'));
      }
      navigate('/jobs');
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Error saving job. Please check all fields and try again.';
      setError(message);
      toast.error(message);
      console.error('Job save error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="job-form-container">
      <h2>{isEditMode ? 'Edit Job' : 'Create New Job'}</h2>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="job-form">
        <div className="form-group">
          <label htmlFor="title">Job Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="location">Location</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="startDate">Start Date</label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            required
          >
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="assignedElectricians">Assigned Electricians</label>
          <select
            id="assignedElectricians"
            name="assignedElectricians"
            multiple
            value={formData.assignedElectricians}
            onChange={handleElectricianChange}
          >
            {electricians.map(electrician => (
              <option key={electrician._id} value={electrician._id}>
                {electrician.name}
              </option>
            ))}
          </select>
          <small>Hold Ctrl (Windows) or Command (Mac) to select multiple electricians</small>
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/jobs')} className="btn btn-outline" disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : isEditMode ? 'Update Job' : 'Create Job'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default JobForm; 