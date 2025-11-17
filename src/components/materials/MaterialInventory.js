import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../config/axios';
import { toast } from 'react-toastify';
import './MaterialInventory.css';

const MaterialInventory = () => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    description: '',
    quantity: '',
    unit: '',
    price: ''
  });
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [requestedMaterial, setRequestedMaterial] = useState({
    materialId: '',
    quantity: '',
    jobId: '',
    notes: ''
  });
  const [jobs, setJobs] = useState([]);
  const [showRequestForm, setShowRequestForm] = useState(false);

  useEffect(() => {
    fetchInventory();
    if (user.role === 'electrician') {
      fetchElectricianJobs();
    }
  }, [user]);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMaterial(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingMaterial(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRequestInputChange = (e) => {
    const { name, value } = e.target;
    setRequestedMaterial(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    try {
      const materialData = {
        ...newMaterial,
        quantity: parseFloat(newMaterial.quantity) || 0,
        price: parseFloat(newMaterial.price) || 0
      };

      await api.post('/materials/inventory', materialData);
      toast.success('Material added to inventory successfully');
      setNewMaterial({
        name: '',
        description: '',
        quantity: '',
        unit: '',
        price: ''
      });
      fetchInventory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error adding material to inventory');
    }
  };

  const handleEditMaterial = (material) => {
    setEditingMaterial({
      ...material,
      quantity: material.quantity.toString(),
      price: material.price.toString()
    });
  };

  const handleUpdateMaterial = async (e) => {
    e.preventDefault();
    try {
      const materialData = {
        ...editingMaterial,
        quantity: parseFloat(editingMaterial.quantity) || 0,
        price: parseFloat(editingMaterial.price) || 0
      };

      await api.put(`/materials/inventory/${editingMaterial._id}`, materialData);
      toast.success('Material updated successfully');
      setEditingMaterial(null);
      fetchInventory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating material');
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (window.confirm('Are you sure you want to delete this material?')) {
      try {
        await api.delete(`/materials/inventory/${materialId}`);
        toast.success('Material deleted successfully');
        fetchInventory();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Error deleting material');
      }
    }
  };

  const handleUpdateQuantity = async (materialId, newQuantity) => {
    try {
      const quantity = parseFloat(newQuantity);
      if (isNaN(quantity) || quantity < 0) {
        toast.error('Please enter a valid quantity');
        return;
      }

      await api.put(`/materials/inventory/${materialId}`, { quantity });
      toast.success('Inventory updated successfully');
      fetchInventory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating inventory');
    }
  };

  const handleMaterialRequest = async (e) => {
    e.preventDefault();
    try {
      const quantity = parseFloat(requestedMaterial.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        toast.error('Please enter a valid quantity');
        return;
      }

      await api.post('/materials/requests', {
        ...requestedMaterial,
        quantity
      });
      toast.success('Material request submitted successfully');
      setRequestedMaterial({
        materialId: '',
        quantity: '',
        jobId: '',
        notes: ''
      });
      setShowRequestForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error submitting material request');
    }
  };

  if (loading) return <div className="loading">Loading inventory...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="material-inventory">
      <h2>Material Inventory</h2>
      
      {user.role === 'admin' && (
        <div className="add-material-form">
          <h3>Add New Material</h3>
          <form onSubmit={handleAddMaterial}>
            <div className="form-group">
              <label>Name:</label>
              <input
                type="text"
                name="name"
                value={newMaterial.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Description:</label>
              <input
                type="text"
                name="description"
                value={newMaterial.description}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Quantity:</label>
              <input
                type="number"
                name="quantity"
                value={newMaterial.quantity}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                required
              />
            </div>
            <div className="form-group">
              <label>Unit:</label>
              <input
                type="text"
                name="unit"
                value={newMaterial.unit}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Price:</label>
              <input
                type="number"
                name="price"
                value={newMaterial.price}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">Add Material</button>
          </form>
        </div>
      )}

      {editingMaterial && (
        <div className="edit-material-form">
          <h3>Edit Material</h3>
          <form onSubmit={handleUpdateMaterial}>
            <div className="form-group">
              <label>Name:</label>
              <input
                type="text"
                name="name"
                value={editingMaterial.name}
                onChange={handleEditInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Description:</label>
              <input
                type="text"
                name="description"
                value={editingMaterial.description}
                onChange={handleEditInputChange}
              />
            </div>
            <div className="form-group">
              <label>Quantity:</label>
              <input
                type="number"
                name="quantity"
                value={editingMaterial.quantity}
                onChange={handleEditInputChange}
                min="0"
                step="0.01"
                required
              />
            </div>
            <div className="form-group">
              <label>Unit:</label>
              <input
                type="text"
                name="unit"
                value={editingMaterial.unit}
                onChange={handleEditInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Price:</label>
              <input
                type="number"
                name="price"
                value={editingMaterial.price}
                onChange={handleEditInputChange}
                min="0"
                step="0.01"
                required
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Update Material</button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setEditingMaterial(null)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="inventory-list">
        <h3>Current Inventory</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Quantity</th>
              <th>Unit</th>
              <th>Price</th>
              {user.role === 'admin' ? (
                <th>Actions</th>
              ) : (
                <th>Request</th>
              )}
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
                {user.role === 'admin' ? (
                  <td className="actions">
                    <input
                      type="number"
                      value={material.quantity}
                      onChange={(e) => handleUpdateQuantity(material._id, e.target.value)}
                      min="0"
                      step="0.01"
                    />
                    <button
                      className="btn btn-edit"
                      onClick={() => handleEditMaterial(material)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-delete"
                      onClick={() => handleDeleteMaterial(material._id)}
                    >
                      Delete
                    </button>
                  </td>
                ) : (
                  <td>
                    <button
                      className="btn btn-outline"
                      onClick={() => {
                        setRequestedMaterial(prev => ({ ...prev, materialId: material._id }));
                        setShowRequestForm(true);
                      }}
                    >
                      Request
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {user.role === 'electrician' && showRequestForm && (
        <div className="request-material-form">
          <h3>Request Material</h3>
          <form onSubmit={handleMaterialRequest}>
            <div className="form-group">
              <label>Select Job:</label>
              <select
                name="jobId"
                value={requestedMaterial.jobId}
                onChange={handleRequestInputChange}
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
                value={requestedMaterial.quantity}
                onChange={handleRequestInputChange}
                min="1"
                step="0.01"
                required
              />
            </div>
            <div className="form-group">
              <label>Notes:</label>
              <textarea
                name="notes"
                value={requestedMaterial.notes}
                onChange={handleRequestInputChange}
                placeholder="Add any additional notes about the request"
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Submit Request</button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowRequestForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default MaterialInventory; 