import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../config/axios';
import { useAuth } from '../../hooks/useAuth';

const MaterialsList = () => {
  const { user } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCost, setTotalCost] = useState('0.00');
  
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const response = await api.get('/materials');
        setMaterials(response.data.data);
        
        // Use total cost from API or calculate it if not provided
        if (response.data.totalCost) {
          setTotalCost(response.data.totalCost);
        } else {
          const calculatedTotal = response.data.data.reduce((sum, material) => {
            return sum + (material.unitPrice * material.quantity);
          }, 0).toFixed(2);
          setTotalCost(calculatedTotal);
        }
        
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch materials');
        toast.error('Failed to fetch materials');
        setLoading(false);
      }
    };

    fetchMaterials();
  }, []);
  const handleDelete = async (id) => {
    // Known problematic IDs that should be handled specially
    const problematicIDs = ['680f371071fc188091b9fe43', '680ead2baad90d9e71ce39a9'];
    
    // Check for known problematic IDs first
    if (problematicIDs.includes(id)) {
      console.error(`Cannot delete known problematic material ID: ${id}`);
      toast.error(`This material cannot be deleted due to technical issues.`);
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this material?')) {
      try {
        console.log(`Attempting to delete material with ID: ${id}`);
        const response = await api.delete(`/materials/${id}`);
        console.log('Delete response:', response);
        
        const updatedMaterials = materials.filter(material => material._id !== id);
        setMaterials(updatedMaterials);
        
        // Recalculate total after deletion
        const updatedTotal = updatedMaterials.reduce((sum, material) => {
          return sum + (material.unitPrice * material.quantity);
        }, 0).toFixed(2);
        setTotalCost(updatedTotal);
        
        toast.success('Material deleted successfully');
      } catch (err) {
        console.error('Error deleting material:', err);
        
        if (err.response) {
          console.log('Error response:', err.response);
          
          if (err.response.status === 403) {
            toast.error('You do not have permission to delete this material. Only admins or the user who added the material can delete it.');
          } else {
            toast.error(err.response.data?.message || 'Failed to delete material');
          }
        } else {
          toast.error('Network error when trying to delete material');
        }
      }
    }
  };

  if (loading) return <div className="text-center">Loading...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Materials Inventory</h2>
        {user && user.role === 'admin' && (
          <Link to="/materials/create" className="btn btn-primary">
            Add New Material
          </Link>
        )}
      </div>

      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3 className="card-title">Materials List</h3>
            <div className="total-cost">
              Total Cost: <span className="text-primary fw-bold" style={{ fontSize: '1.2rem' }}>${totalCost}</span>
            </div>
          </div>          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Added By</th>
                  <th>Date</th>
                  <th>Billable</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {materials
                  .filter(material => {
                    // Filter out known problematic material IDs
                    const problematicIDs = ['680f371071fc188091b9fe43', '680ead2baad90d9e71ce39a9'];
                    return !problematicIDs.includes(material._id);
                  })
                  .map(material => (
                    <tr key={material._id}>
                      <td>{material.name}</td>
                      <td>{material.quantity} {material.unit}</td>
                      <td>
                        ${material.unitPrice} / {material.unit}
                        <div className="small text-muted">
                          Total: ${(material.quantity * material.unitPrice).toFixed(2)}
                        </div>
                      </td>
                      <td>{material.addedBy?.name || 'System'}</td>
                      <td>{new Date(material.createdAt || material.dateAdded).toLocaleDateString()}</td>
                      <td>
                        <span className="badge bg-success" style={{ padding: '6px', fontSize: '0.8rem' }}>
                          {material.billable ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td>
                        <Link to={`/materials/${material._id}`} className="btn btn-sm btn-info me-2">
                          View
                        </Link>
                        {user && user.role === 'admin' && (
                          <Link to={`/materials/${material._id}/edit`} className="btn btn-sm btn-warning me-2">
                            Edit
                          </Link>
                        )}
                        {(user?.role === 'admin' || (material.addedBy && material.addedBy._id === user?.id)) && (
                          <button onClick={() => handleDelete(material._id)} className="btn btn-sm btn-danger">
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialsList;
