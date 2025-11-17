import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../config/axios';
import './MaterialForm.css';

const MaterialForm = ({ jobId, onMaterialAdded }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  // If an ID is provided in the route AND we're not in "add to job" mode
  const isEdit = Boolean(id) && !jobId;
  // We're in "add to job" mode if jobId prop is provided
  const isAddToJobMode = Boolean(jobId);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: '0',
    unit: '',
    unitPrice: '0',
    description: '',
    supplier: '',
    minimumStock: '0',
    job: jobId || '' // Pre-fill job ID if provided as prop
  });

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await api.get('/jobs');
        setJobs(response.data.data);
      } catch (err) {
        toast.error('Failed to fetch jobs');
      }
    };

    // Only fetch jobs list if not in "add to job" mode
    if (!isAddToJobMode) {
      fetchJobs();
    }

    // Fetch material only if we're editing an existing material
    if (isEdit) {
      const fetchMaterial = async () => {
        try {
          console.log(`Fetching material with ID: ${id}`);
          
          // Known problematic IDs that should be handled specially
          const problematicIDs = ['680f371071fc188091b9fe43', '680ead2baad90d9e71ce39a9'];
          
          // Check for known problematic IDs first
          if (problematicIDs.includes(id)) {
            console.error(`Known problematic material ID detected: ${id}`);
            toast.error(`This material cannot be edited. It appears to be invalid or deleted.`);
            setTimeout(() => navigate('/materials'), 1500);
            return;
          }
          
          // Validate the material ID format (MongoDB ObjectId is 24 hex characters)
          if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
            console.error(`Invalid material ID format: ${id}`);
            toast.error('Invalid material ID format');
            setTimeout(() => navigate('/materials'), 1500);
            return;
          }
          
          setLoading(true);
          const response = await api.get(`/materials/${id}`);
          
          if (!response.data || !response.data.success) {
            throw new Error(response.data?.message || 'Failed to fetch material data');
          }
          
          const material = response.data.data;
          
          if (!material) {
            throw new Error('Material data not found in response');
          }
          
          console.log('Successfully fetched material:', material);
          
          setFormData({
            name: material.name || '',
            category: material.category || '',
            quantity: material.quantity?.toString() || '0',
            unit: material.unit || '',
            unitPrice: material.unitPrice?.toString() || '0',
            description: material.description || '',
            supplier: material.supplier || '',
            minimumStock: material.minimumStock?.toString() || '0',
            job: material.job?._id || ''
          });
          setLoading(false);
        } catch (err) {
          console.error('Error fetching material:', err);
          const statusCode = err.response?.status;
          let errorMessage = '';
          
          if (statusCode === 404) {
            errorMessage = `Material with ID ${id} not found. It may have been deleted.`;
          } else if (statusCode === 403) {
            errorMessage = 'You do not have permission to edit this material.';
          } else {
            errorMessage = err.response?.data?.message || 'Failed to fetch material details';
          }
          
          toast.error(errorMessage);
          setTimeout(() => navigate('/materials'), 1500);
          setLoading(false);
        }
      };
      fetchMaterial();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEdit]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.quantity) newErrors.quantity = 'Quantity is required';
    if (!formData.unit) newErrors.unit = 'Unit is required';
    if (!formData.unitPrice) newErrors.unitPrice = 'Price is required';
    if (!formData.job) newErrors.job = 'Job is required';
    if (parseFloat(formData.quantity) < 0) newErrors.quantity = 'Quantity cannot be negative';
    if (parseFloat(formData.unitPrice) < 0) newErrors.unitPrice = 'Price cannot be negative';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Skip job field validation if we're in "add to job" mode
    if (isAddToJobMode) {
      // Remove job from required fields for validation
      const validateJobMaterial = () => {
        const newErrors = {};
        if (!formData.name) newErrors.name = 'Name is required';
        if (!formData.category) newErrors.category = 'Category is required';
        if (!formData.quantity) newErrors.quantity = 'Quantity is required';
        if (!formData.unit) newErrors.unit = 'Unit is required';
        if (!formData.unitPrice) newErrors.unitPrice = 'Price is required';
        if (parseFloat(formData.quantity) < 0) newErrors.quantity = 'Quantity cannot be negative';
        if (parseFloat(formData.unitPrice) < 0) newErrors.unitPrice = 'Price cannot be negative';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
      };
      
      if (!validateJobMaterial()) return;
    } else {
      if (!validateForm()) return;
    }

    const submitData = {
      ...formData,
      quantity: parseFloat(formData.quantity),
      unitPrice: parseFloat(formData.unitPrice),
      minimumStock: parseFloat(formData.minimumStock)
    };

    setLoading(true);
    try {
      let response;
      
      if (isEdit) {
        // Case 1: Editing an existing material
        response = await api.put(`/materials/${id}`, submitData);
        toast.success('Material updated successfully');
        navigate('/materials');
      } else if (isAddToJobMode) {
        // Case 2: Adding material to a specific job
        response = await api.post(`/materials/job/${jobId}`, submitData);
        toast.success('Material added to job successfully');
        // Call the callback to update parent component
        if (onMaterialAdded) {
          onMaterialAdded(response.data.data);
        }
        // Reset form for adding more materials
        setFormData({
          name: '',
          category: '',
          quantity: '0',
          unit: '',
          unitPrice: '0',
          description: '',
          supplier: '',
          minimumStock: '0',
          job: jobId
        });
      } else {
        // Case 3: Creating a new material
        response = await api.post('/materials', submitData);
        toast.success('Material created successfully');
        
        // ERROR #4 FIX: Trigger dashboard refresh after creating new material
        window.dispatchEvent(new Event('refreshDashboard'));
        
        navigate('/materials');
      }
    } catch (err) {
      console.error('Error submitting material form:', err);
      toast.error(err.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className={isAddToJobMode ? "card mb-4" : "container mt-4"}>
      {isAddToJobMode ? (
        <div className="card-header">
          <h4>Add Material to Job</h4>
        </div>
      ) : (
        <h2>{isEdit ? 'Edit Material' : 'Add New Material'}</h2>
      )}
      <div className={isAddToJobMode ? "card-body" : ""}>
        <form onSubmit={handleSubmit} className="mt-2">
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Name</label>
              <input
                type="text"
                className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
              {errors.name && <div className="invalid-feedback">{errors.name}</div>}
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label">Category</label>
              <select
                className={`form-select ${errors.category ? 'is-invalid' : ''}`}
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="">Select Category</option>
                <option value="Electrical">Electrical</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Hardware">Hardware</option>
                <option value="Tools">Tools</option>
                <option value="Safety">Safety</option>
              </select>
              {errors.category && <div className="invalid-feedback">{errors.category}</div>}
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">Quantity</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={`form-control ${errors.quantity ? 'is-invalid' : ''}`}
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
              />
              {errors.quantity && <div className="invalid-feedback">{errors.quantity}</div>}
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">Unit</label>
              <select
                className={`form-select ${errors.unit ? 'is-invalid' : ''}`}
                name="unit"
                value={formData.unit}
                onChange={handleChange}
              >
                <option value="">Select Unit</option>
                <option value="pcs">Pieces</option>
                <option value="kg">Kilograms</option>
                <option value="m">Meters</option>
                <option value="l">Liters</option>
                <option value="box">Box</option>
              </select>
              {errors.unit && <div className="invalid-feedback">{errors.unit}</div>}
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={`form-control ${errors.unitPrice ? 'is-invalid' : ''}`}
                name="unitPrice"
                value={formData.unitPrice}
                onChange={handleChange}
              />
              {errors.unitPrice && <div className="invalid-feedback">{errors.unitPrice}</div>}
            </div>          
            
            {!isAddToJobMode && (
              <div className="col-md-6 mb-3">
                <label className="form-label">Job</label>
                <select
                  className={`form-select ${errors.job ? 'is-invalid' : ''}`}
                  name="job"
                  value={formData.job}
                  onChange={handleChange}
                >
                  <option value="">Select Job</option>
                  {jobs.map(job => (
                    <option key={job._id} value={job._id}>
                      {job.title}
                    </option>
                  ))}
                </select>
                {errors.job && <div className="invalid-feedback">{errors.job}</div>}
              </div>
            )}

            <div className="col-md-6 mb-3">
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
              />
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label">Supplier</label>
              <input
                type="text"
                className="form-control"
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label">Minimum Stock Level</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-control"
                name="minimumStock"
                value={formData.minimumStock}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="mt-3">
            <button
              type="submit"
              className="btn btn-primary me-2"
              disabled={loading}
            >
              {loading ? 'Saving...' : isEdit ? 'Update Material' : isAddToJobMode ? 'Add to Job' : 'Add Material'}
            </button>
            {!isAddToJobMode && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/materials')}
              >
                Cancel
              </button>
            )}
            {isAddToJobMode && (
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => {
                  setFormData({
                    name: '',
                    category: '',
                    quantity: '0',
                    unit: '',
                    unitPrice: '0',
                    description: '',
                    supplier: '',
                    minimumStock: '0',
                    job: jobId
                  });
                }}
              >
                Clear Form
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaterialForm;
