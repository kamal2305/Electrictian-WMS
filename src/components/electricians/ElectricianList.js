import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../config/axios';
import { toast } from 'react-toastify';
import './ElectricianList.css';

const ElectricianList = () => {
  const [electricians, setElectricians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchElectricians();
  }, []);

  const fetchElectricians = async () => {
    try {
      const res = await api.get('/users/electricians');
      setElectricians(res.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching electricians');
      toast.error('Error fetching electricians');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) {
      return;
    }

    try {
      await api.delete(`/users/electricians/${id}`);
      toast.success('Electrician deleted successfully');
      fetchElectricians();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting electrician');
    }
  };

  const filteredElectricians = electricians.filter(
    electrician =>
      electrician.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      electrician.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      electrician.phone.includes(searchTerm)
  );

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="electrician-list-container">
      <div className="electrician-list-header">
        <h2>Electricians Management</h2>
        <Link to="/electricians/create" className="btn btn-primary">
          Add New Electrician
        </Link>
      </div>

      <div className="search-filter">
        <input
          type="text"
          placeholder="Search by name, email or phone..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {filteredElectricians.length === 0 ? (
        <div className="no-results">
          {searchTerm ? 'No electricians match your search' : 'No electricians found'}
        </div>
      ) : (
        <div className="electrician-grid">
          {filteredElectricians.map(electrician => (
            <div key={electrician._id} className="electrician-card">
              <div className="electrician-card-header">
                <h3>{electrician.name}</h3>
              </div>
              <div className="electrician-card-body">
                <p>
                  <i className="fas fa-envelope"></i> {electrician.email}
                </p>
                <p>
                  <i className="fas fa-phone"></i> {electrician.phone}
                </p>
                <p>
                  <i className="fas fa-calendar"></i> Joined:{' '}
                  {new Date(electrician.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="electrician-job-summary">
                <Link to={`/jobs/electrician/${electrician._id}`} className="job-summary-link">
                  View Job History
                </Link>
              </div>
              <div className="electrician-card-actions">
                <Link
                  to={`/electricians/${electrician._id}/edit`}
                  className="btn btn-secondary btn-sm"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(electrician._id, electrician.name)}
                  className="btn btn-danger btn-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ElectricianList; 