import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';
import './MaterialReport.css';

const MaterialReport = () => {
  const { user } = useAuth();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('jobs');

  useEffect(() => {
    fetchMaterialReport();
  }, []);

  const fetchMaterialReport = async () => {
    try {
      const response = await axios.get('/api/reports/materials');
      setReportData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching report:', error);
      setError(error.response?.data?.message || 'Failed to load material usage report');
      toast.error('Error loading material report');
      setLoading(false);
    }
  };

  // Only admins can access this report
  if (user?.role !== 'admin') {
    return <div className="unauthorized-message">Only administrators can access material reports.</div>;
  }

  if (loading) {
    return <div className="report-loading">Loading material report...</div>;
  }

  if (error) {
    return <div className="report-error">{error}</div>;
  }

  if (!reportData || !reportData.data) {
    return <div className="report-empty">No material data available.</div>;
  }

  const renderByJobTab = () => {
    return (
      <div className="report-section">
        <h3>Material Usage by Job</h3>
        
        <div className="report-table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th>Job</th>
                <th>Location</th>
                <th>Material Count</th>
                <th>Total Cost</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {reportData.byJob.map((jobData, index) => (
                <React.Fragment key={index}>
                  <tr className="job-row">
                    <td>{jobData.job.title}</td>
                    <td>{jobData.job.location}</td>
                    <td>{jobData.materialCount}</td>
                    <td className="cost-cell">${jobData.totalCost.toFixed(2)}</td>
                    <td>
                      <button 
                        className="btn-toggle"
                        onClick={() => toggleDetails(`job-${index}`)}
                      >
                        <i className="fas fa-chevron-down"></i>
                      </button>
                    </td>
                  </tr>
                  <tr className="details-row" id={`job-${index}-details`} style={{display: 'none'}}>
                    <td colSpan="5">
                      <div className="material-details">
                        <h4>Materials Used</h4>
                        <table className="details-table">
                          <thead>
                            <tr>
                              <th>Material</th>
                              <th>Total Quantity</th>
                              <th>Total Cost</th>
                            </tr>
                          </thead>
                          <tbody>
                            {jobData.byMaterial.map((material, mIndex) => (
                              <tr key={mIndex}>
                                <td>{material.name}</td>
                                <td>{material.totalQuantity.toFixed(2)}</td>
                                <td>${material.totalCost.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderByElectricianTab = () => {
    return (
      <div className="report-section">
        <h3>Material Usage by Electrician</h3>
        
        <div className="report-table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th>Electrician</th>
                <th>Material Count</th>
                <th>Total Cost</th>
              </tr>
            </thead>
            <tbody>
              {reportData.byElectrician.map((electricianData, index) => (
                <tr key={index}>
                  <td>{electricianData.electrician.name}</td>
                  <td>{electricianData.materialCount}</td>
                  <td className="cost-cell">${electricianData.totalCost.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const toggleDetails = (id) => {
    const detailsRow = document.getElementById(`${id}-details`);
    if (detailsRow) {
      detailsRow.style.display = detailsRow.style.display === 'none' ? 'table-row' : 'none';
    }
  };

  return (
    <div className="material-report-container">
      <div className="report-header">
        <h2>Material Usage Report</h2>
        <div className="report-summary">
          <div className="summary-item">
            <span className="summary-label">Total Materials:</span>
            <span className="summary-value">{reportData.count}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Total Cost:</span>
            <span className="summary-value">${reportData.totalCost}</span>
          </div>
        </div>
      </div>

      <div className="report-tabs">
        <button 
          className={`tab-button ${activeTab === 'jobs' ? 'active' : ''}`}
          onClick={() => setActiveTab('jobs')}
        >
          By Job
        </button>
        <button 
          className={`tab-button ${activeTab === 'electricians' ? 'active' : ''}`}
          onClick={() => setActiveTab('electricians')}
        >
          By Electrician
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'jobs' ? renderByJobTab() : renderByElectricianTab()}
      </div>

      <div className="report-actions">
        <button 
          className="btn-export"
          onClick={() => window.print()}
        >
          Print Report
        </button>
      </div>
    </div>
  );
};

export default MaterialReport; 