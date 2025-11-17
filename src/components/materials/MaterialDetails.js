import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../config/axios';
import { useAuth } from '../../hooks/useAuth';

const MaterialDetails = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const [material, setMaterial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);  useEffect(() => {
    const fetchMaterial = async () => {
      try {
        console.log(`Fetching material details for ID: ${id}`);
        
        // Known problematic IDs that should be handled specially
        const problematicIDs = ['680f371071fc188091b9fe43', '680ead2baad90d9e71ce39a9'];
        
        // Check for known problematic IDs first
        if (problematicIDs.includes(id)) {
          console.error(`Known problematic material ID detected: ${id}`);
          setError(`Material with ID ${id} cannot be displayed. It appears to be invalid or deleted.`);
          setLoading(false);
          return;
        }
        
        // Check if ID is valid format
        if (!id || id === 'create' || id === 'inventory' || !id.match(/^[0-9a-fA-F]{24}$/)) {
          throw new Error(`Invalid material ID format: ${id}`);
        }
        
        const response = await api.get(`/materials/${id}`);
        console.log('Material data received:', response.data);
        
        if (!response.data || !response.data.success) {
          throw new Error(response.data?.message || 'Failed to fetch material data');
        }
        
        setMaterial(response.data.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching material details:', err);
        
        const statusCode = err.response?.status;
        let errorMessage = '';
        
        if (statusCode === 404) {
          errorMessage = `Material with ID ${id} not found. It may have been deleted.`;
        } else if (statusCode === 403) {
          errorMessage = 'You do not have permission to view this material.';
        } else {
          errorMessage = err.response?.data?.message || err.message || 'Failed to fetch material details';
        }
        
        setError(errorMessage);
        toast.error(errorMessage);
        setLoading(false);
      }
    };

    fetchMaterial();
  }, [id]);

  if (loading) return <div className="text-center">Loading...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!material) return <div className="alert alert-warning">Material not found</div>;

  return (
    <div className="container mt-4">
      <div className="card">        <div className="card-header d-flex justify-content-between align-items-center">
          <h3 className="mb-0">Material Details</h3>
          <div>
            {user && user.role === 'admin' && (
              <Link to={`/materials/${id}/edit`} className="btn btn-warning me-2">
                Edit
              </Link>
            )}
            <Link to="/materials" className="btn btn-secondary">
              Back to List
            </Link>
          </div>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <h5>Basic Information</h5>
              <table className="table">
                <tbody>
                  <tr>
                    <th>Name:</th>
                    <td>{material.name}</td>
                  </tr>
                  <tr>
                    <th>Category:</th>
                    <td>{material.category}</td>
                  </tr>
                  <tr>
                    <th>Description:</th>
                    <td>{material.description || 'N/A'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="col-md-6">
              <h5>Inventory Details</h5>
              <table className="table">
                <tbody>
                  <tr>
                    <th>Current Quantity:</th>
                    <td>
                      {material.quantity} {material.unit}
                    </td>
                  </tr>
                  <tr>
                    <th>Minimum Stock Level:</th>
                    <td>
                      {material.minimumStock || 'Not set'} {material.unit}
                    </td>
                  </tr>
                  <tr>
                    <th>Price:</th>
                    <td>${material.unitPrice}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="row mt-4">
            <div className="col-md-6">
              <h5>Supplier Information</h5>
              <table className="table">
                <tbody>
                  <tr>
                    <th>Supplier:</th>
                    <td>{material.supplier || 'N/A'}</td>
                  </tr>
                  <tr>
                    <th>Job:</th>
                    <td>{material.job?.title || 'N/A'}</td>
                  </tr>
                  <tr>
                    <th>Added By:</th>
                    <td>{material.addedBy?.name || 'N/A'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="col-md-6">
              <h5>Status</h5>
              <div className="alert alert-info">
                {material.quantity <= (material.minimumStock || 0) ? (
                  <span className="text-danger">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    Low Stock Alert
                  </span>
                ) : (
                  <span className="text-success">
                    <i className="fas fa-check-circle me-2"></i>
                    Stock Level OK
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialDetails; 