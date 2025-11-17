import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../config/axios';
import './TimeLogList.css';

const TimeLogList = ({ jobId }) => {
  const [timeLogs, setTimeLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTimeLogs = async () => {
      try {
        const response = await api.get(`/timelogs/job/${jobId}`);
        setTimeLogs(response.data.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching time logs:', error);
        setError('Failed to load time logs');
        toast.error('Error loading time logs');
        setLoading(false);
      }
    };

    if (jobId) {
      fetchTimeLogs();
    }
  }, [jobId]);

  // Format duration to hours and minutes
  const formatDuration = (minutes) => {
    if (!minutes) return '0 min';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours} hr`;
    return `${hours} hr ${mins} min`;
  };

  if (loading) {
    return <div className="time-logs-loading">Loading time logs...</div>;
  }

  if (error) {
    return <div className="time-logs-error">{error}</div>;
  }

  if (timeLogs.length === 0) {
    return <div className="time-logs-empty">No time logs recorded for this job yet.</div>;
  }

  return (
    <div className="time-logs-container">
      <h3>Time Logs</h3>
      <div className="time-logs-table-container">
        <table className="time-logs-table">
          <thead>
            <tr>
              <th>Electrician</th>
              <th>Date</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Type</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {timeLogs.map((log) => (
              <tr key={log._id} className={log.status === 'Active' ? 'active-log' : ''}>
                <td>{log.electrician.name}</td>
                <td>{new Date(log.date).toLocaleDateString()}</td>
                <td>{new Date(log.checkInTime).toLocaleTimeString()}</td>
                <td>{log.checkOutTime ? new Date(log.checkOutTime).toLocaleTimeString() : '-'}</td>
                <td>{formatDuration(log.duration)}</td>
                <td><span className={`status-pill ${log.status.toLowerCase()}`}>{log.status}</span></td>
                <td><span className={`entry-type ${log.isManualEntry ? 'manual' : 'auto'}`}>{log.isManualEntry ? 'Manual' : 'Auto'}</span></td>
                <td className="notes-cell">{log.notes || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="time-logs-summary">
        <div className="summary-item">
          <span className="summary-label">Total logs:</span>
          <span className="summary-value">{timeLogs.length}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Total hours:</span>
          <span className="summary-value">
            {formatDuration(timeLogs.reduce((acc, log) => acc + (log.duration || 0), 0))}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TimeLogList; 