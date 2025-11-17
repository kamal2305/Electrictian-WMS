import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';
import api from '../../config/axios';
import './MaterialList.css';

const MaterialList = ({ jobId }) => {
  const { user } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCost, setTotalCost] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMaterials = useCallback(async () => {
    try {
      const response = await api.get(`/materials/job/${jobId}`);
      setMaterials(response.data.data);
      
      // Use total cost from API or calculate it if not provided
      if (response.data.totalCost) {
        setTotalCost(response.data.totalCost);
      } else {
        // Calculate the total cost locally if not provided by the API
        const calculatedTotal = response.data.data.reduce((sum, material) => {
          return sum + (material.unitPrice * material.quantity);
        }, 0).toFixed(2);
        setTotalCost(calculatedTotal);
      }
      
      setError(null);
    } catch (error) {
      console.error('Error fetching materials:', error);
      setError('Failed to load materials');
      toast.error('Error loading materials');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);
    const handleDelete = async (id) => {
    // Known problematic IDs that should be handled specially
    const problematicIDs = ['680f371071fc188091b9fe43', '680ead2baad90d9e71ce39a9'];
    
    // Check for known problematic IDs first
    if (problematicIDs.includes(id)) {
      console.error(`Cannot delete known problematic material ID: ${id}`);
      toast.error(`This material cannot be deleted due to technical issues.`);
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this material?')) {
      return;
    }

    setIsDeleting(true);
    try {
      console.log(`Attempting to delete material with ID: ${id}`);
      const response = await api.delete(`/materials/${id}`);
      console.log('Delete response:', response);
      
      // Update local state directly instead of refetching
      const updatedMaterials = materials.filter(material => material._id !== id);
      setMaterials(updatedMaterials);
      
      // Recalculate the total cost after deletion
      const updatedTotal = updatedMaterials.reduce((sum, material) => {
        return sum + (material.unitPrice * material.quantity);
      }, 0).toFixed(2);
      setTotalCost(updatedTotal);
      
      toast.success('Material deleted successfully');
    } catch (error) {
      console.error('Error deleting material:', error);
      
      if (error.response) {
        console.log('Error response:', error.response);
        
        if (error.response.status === 403) {
          toast.error('You do not have permission to delete this material. Only admins or the user who added the material can delete it.');
        } else {
          toast.error(error.response.data?.message || 'Failed to delete material');
        }
      } else {
        toast.error('Network error when trying to delete material');
      }
      
      // Still fetch materials in case of an error to ensure UI is in sync
      fetchMaterials();
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <div className="materials-loading">Loading materials...</div>;
  }

  if (error) {
    return <div className="materials-error">{error}</div>;
  }

  if (materials.length === 0) {
    return <div className="materials-empty">No materials have been added to this job yet.</div>;
  }
  return (
    <div className="materials-container">
      <div className="materials-header">
        <h3>Materials List</h3>
        <div className="total-cost">
          Total Cost: <span className="cost-value">${totalCost}</span>
        </div>
      </div><div className="materials-table-container">
        <table className="materials-table">
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
              // Filter out known problematic material IDs
              .filter(material => {
                const problematicIDs = ['680f371071fc188091b9fe43', '680ead2baad90d9e71ce39a9'];
                return !problematicIDs.includes(material._id);
              })
              .map(material => (
                <tr key={material._id}>
                  <td className="material-name">
                    <div>{material.name}</div>
                    {material.notes && (
                      <div className="material-notes">{material.notes}</div>
                    )}
                  </td>
                  <td>
                    {material.quantity} {material.unit}
                  </td>
                  <td>
                    ${material.unitPrice} / {material.unit}
                    <div className="total-price">
                      Total: ${(material.quantity * material.unitPrice).toFixed(2)}
                    </div>
                  </td>
                  <td>{material.addedBy.name}</td>
                  <td>{new Date(material.dateAdded).toLocaleDateString()}</td>                  <td>
                    <span className={`billable-tag ${material.billable ? 'billable' : 'non-billable'}`}>
                      {material.billable ? 'Yes' : 'No'}
                    </span>
                  </td>                  {(user?.role === 'admin' || material.addedBy._id === user?.id) && (
                    <td className="action-buttons">
                      <button 
                        onClick={() => handleDelete(material._id)} 
                        className="btn-delete"
                        disabled={isDeleting}
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MaterialList;
