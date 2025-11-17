import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../config/axios';
import { toast } from 'react-toastify';
import './ElectricianForm.css';

const ElectricianForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchElectricianDetails = async () => {
    try {
      const res = await api.get(`/users/electricians/${id}`);
      const electrician = res.data.data;
      setFormData({
        name: electrician.name,
        email: electrician.email,
        phone: electrician.phone,
        password: '',
        confirmPassword: ''
      });
    } catch (err) {
      setError('Error fetching electrician details');
      toast.error('Error fetching electrician details');
      navigate('/electricians');
    }
  };

  useEffect(() => {
    if (isEditMode) {
      fetchElectricianDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const submissionData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone
      };

      if (!isEditMode) {
        submissionData.password = formData.password;
      }

      if (isEditMode) {
        await api.put(`/users/electricians/${id}`, submissionData);
        toast.success('Electrician updated successfully');
      } else {
        await api.post('/users/electricians', submissionData);
        toast.success('Electrician created successfully');
        
        // ERROR #4 FIX: Trigger dashboard refresh after creating new electrician
        window.dispatchEvent(new Event('refreshDashboard'));
      }
      navigate('/electricians');
    } catch (err) {
      const message = err.response?.data?.message || 'Error saving electrician';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) return <div className="loading">Loading...</div>;

  return (
    <div className="electrician-form-container">
      <h2>{isEditMode ? 'Edit Electrician' : 'Add New Electrician'}</h2>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="electrician-form">
        <div className="form-group">
          <label htmlFor="name">Full Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">
            {isEditMode ? 'Password (leave blank to keep current)' : 'Password'}
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required={!isEditMode}
            minLength={isEditMode ? undefined : 6}
          />
          {!isEditMode && <small>Password must be at least 6 characters</small>}
        </div>

        <div className="form-group">
          <label htmlFor="phone">Phone Number</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            onClick={() => navigate('/electricians')} 
            className="btn btn-outline"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
          >
            {loading ? 'Saving...' : isEditMode ? 'Update Electrician' : 'Add Electrician'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ElectricianForm; 