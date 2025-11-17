import React, { useState, useEffect } from 'react';
import api from '../../config/axios';
import { toast } from 'react-toastify';
import './ElectricianInventory.css';

const ElectricianInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showUsageForm, setShowUsageForm] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [requestForm, setRequestForm] = useState({
    jobId: '',
    quantity: '',
    notes: ''
  });
  const [usageForm, setUsageForm] = useState({
    jobId: '',
    quantity: '',
    notes: ''
  });
  const [materialUsage, setMaterialUsage] = useState([]);

  useEffect(() => {
    fetchInventory();
    fetchElectricianJobs();
    fetchMaterialUsage();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await api.get('/materials/inventory');
      setInventory(response.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching inventory');
      toast.error('Error fetching inventory');
    } finally {
      setLoading(false);
    }
  };

  const fetchElectricianJobs = async () => {
    try {
      const response = await api.get('/jobs/electrician/current');
      setJobs(response.data.data);
    } catch (err) {
      toast.error('Error fetching jobs');
    }
  };

  const fetchMaterialUsage = async () => {
    try {
      const response = await api.get('/materials/usage');
      setMaterialUsage(response.data.data);
    } catch (err) {
      toast.error('Error fetching material usage');
    }
  };

  const handleRequestClick = (material) => {
    setSelectedMaterial(material);
    setRequestForm({
      jobId: '',
      quantity: '',
      notes: ''
    });
    setShowRequestForm(true);
  };

  const handleUsageClick = (material) => {
    setSelectedMaterial(material);
    setUsageForm({
      jobId: '',
      quantity: '',
      notes: ''
    });
    setShowUsageForm(true);
  };

  const handleInputChange = (e, formType) => {
    const { name, value } = e.target;
    if (formType === 'request') {
      setRequestForm(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      setUsageForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    try {
      const quantity = parseFloat(requestForm.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        toast.error('Please enter a valid quantity');
        return;
      }

      if (!requestForm.jobId) {
        toast.error('Please select a job');
        return;
      }

      await api.post('/materials/requests', {
        materialId: selectedMaterial._id,
        jobId: requestForm.jobId,
        quantity,
        notes: requestForm.notes
      });

      toast.success('Material request submitted successfully');
      setShowRequestForm(false);
      setSelectedMaterial(null);
      setRequestForm({
        jobId: '',
        quantity: '',
        notes: ''
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error submitting request');
    }
  };

  const handleSubmitUsage = async (e) => {
    e.preventDefault();
    try {
      const quantity = parseFloat(usageForm.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        toast.error('Please enter a valid quantity');
        return;
      }

      if (!usageForm.jobId) {
        toast.error('Please select a job');
        return;
      }

      await api.post('/materials/usage', {
        materialId: selectedMaterial._id,
        jobId: usageForm.jobId,
        quantity,
        notes: usageForm.notes
      });

      toast.success('Material usage recorded successfully');
      setShowUsageForm(false);
      setSelectedMaterial(null);
      setUsageForm({
        jobId: '',
        quantity: '',
        notes: ''
      });
      fetchInventory();
      fetchMaterialUsage();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error recording material usage');
    }
  };

  if (loading) return <div className="loading">Loading inventory...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="electrician-inventory">
      <h2>Material Inventory</h2>
      <p className="subtitle">View available materials and track usage</p>

      <div className="inventory-list">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Available Quantity</th>
              <th>Unit</th>
              <th>Price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map(material => (
              <tr key={material._id}>
                <td>{material.name}</td>
                <td>{material.description}</td>
                <td>{material.quantity}</td>
                <td>{material.unit}</td>
                <td>${material.price.toFixed(2)}</td>
                <td>
                  <button
                    className="btn btn-request"
                    onClick={() => handleRequestClick(material)}
                    disabled={material.quantity <= 0}
                  >
                    Request
                  </button>
                  <button
                    className="btn btn-usage"
                    onClick={() => handleUsageClick(material)}
                  >
                    Record Usage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="material-usage">
        <h3>Material Usage History</h3>
        <table>
          <thead>
            <tr>
              <th>Material</th>
              <th>Job</th>
              <th>Quantity Used</th>
              <th>Date</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {materialUsage.map(usage => (
              <tr key={usage._id}>
                <td>{usage.material.name}</td>
                <td>{usage.job.title}</td>
                <td>{usage.quantity} {usage.material.unit}</td>
                <td>{new Date(usage.date).toLocaleDateString()}</td>
                <td>{usage.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showRequestForm && selectedMaterial && (
        <div className="modal">
          <div className="modal-content">
            <h3>Request Material</h3>
            <p className="material-info">
              Requesting: <strong>{selectedMaterial.name}</strong>
            </p>
            <form onSubmit={handleSubmitRequest}>
              <div className="form-group">
                <label>Select Job:</label>
                <select
                  name="jobId"
                  value={requestForm.jobId}
                  onChange={(e) => handleInputChange(e, 'request')}
                  required
                >
                  <option value="">Select a job</option>
                  {jobs.map(job => (
                    <option key={job._id} value={job._id}>
                      {job.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Quantity:</label>
                <input
                  type="number"
                  name="quantity"
                  value={requestForm.quantity}
                  onChange={(e) => handleInputChange(e, 'request')}
                  min="1"
                  max={selectedMaterial.quantity}
                  step="0.01"
                  required
                />
                <span className="available-quantity">
                  Available: {selectedMaterial.quantity} {selectedMaterial.unit}
                </span>
              </div>
              <div className="form-group">
                <label>Notes:</label>
                <textarea
                  name="notes"
                  value={requestForm.notes}
                  onChange={(e) => handleInputChange(e, 'request')}
                  placeholder="Add any additional notes about your request"
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  Submit Request
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setShowRequestForm(false);
                    setSelectedMaterial(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUsageForm && selectedMaterial && (
        <div className="modal">
          <div className="modal-content">
            <h3>Record Material Usage</h3>
            <p className="material-info">
              Recording usage for: <strong>{selectedMaterial.name}</strong>
            </p>
            <form onSubmit={handleSubmitUsage}>
              <div className="form-group">
                <label>Select Job:</label>
                <select
                  name="jobId"
                  value={usageForm.jobId}
                  onChange={(e) => handleInputChange(e, 'usage')}
                  required
                >
                  <option value="">Select a job</option>
                  {jobs.map(job => (
                    <option key={job._id} value={job._id}>
                      {job.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Quantity Used:</label>
                <input
                  type="number"
                  name="quantity"
                  value={usageForm.quantity}
                  onChange={(e) => handleInputChange(e, 'usage')}
                  min="0.01"
                  step="0.01"
                  required
                />
                <span className="available-quantity">
                  Available: {selectedMaterial.quantity} {selectedMaterial.unit}
                </span>
              </div>
              <div className="form-group">
                <label>Notes:</label>
                <textarea
                  name="notes"
                  value={usageForm.notes}
                  onChange={(e) => handleInputChange(e, 'usage')}
                  placeholder="Add any notes about the material usage"
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  Record Usage
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setShowUsageForm(false);
                    setSelectedMaterial(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ElectricianInventory; 