import React, { useState, useEffect } from 'react';
import api from '../../config/axios';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';
import './AttendanceReport.css';

const AttendanceReport = () => {
  const { user } = useAuth();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('daily');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [week, setWeek] = useState(getWeekValue());
  const [electricians, setElectricians] = useState([]);
  const [selectedElectrician, setSelectedElectrician] = useState('all');
  const [detailedView, setDetailedView] = useState(false);
  // Calculate current week value for the input
  function getWeekValue() {
    const now = new Date();
    const onejan = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil((((now - onejan) / 86400000) + onejan.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
  }
  
  // Fetch electricians on component mount
  useEffect(() => {
    const fetchElectricians = async () => {
      try {
        const response = await api.get('/users?role=electrician');
        if (response.data.success) {
          setElectricians(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching electricians:', error);
        toast.error('Failed to load electricians');
      }
    };
    
    fetchElectricians();
  }, []);

  const generateReport = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let endpoint = '/timelogs/reports/attendance';
      const params = { 
        ...(reportType === 'daily' ? { date } : { week: formatWeekToDate(week) }),
        ...(selectedElectrician !== 'all' ? { electrician: selectedElectrician } : {}),
        detailed: detailedView
      };
      
      const response = await api.get(endpoint, { params });
      setReportData(response.data.data);
      toast.success('Report generated successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error(error.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  // Convert week format (YYYY-Www) to a date for the API
  function formatWeekToDate(weekStr) {
    const [year, week] = weekStr.split('-W');
    const firstDayOfYear = new Date(parseInt(year), 0, 1);
    const days = 1 + (parseInt(week) - 1) * 7;
    const date = new Date(firstDayOfYear.setDate(days));
    return date.toISOString().split('T')[0];
  }

  // Export to CSV
  const exportToCSV = () => {
    if (!reportData) return;
    
    // Prepare CSV content
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    // Headers
    csvContent += 'Electrician Name,Email,Total Hours,Log Count\n';
    
    // Add electrician data
    reportData.electricians.forEach(electrician => {
      csvContent += `${electrician.name},${electrician.email},${electrician.totalHours},${electrician.logCount}\n`;
    });
    
    // Encode and trigger download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${reportData.title.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Report exported to CSV');
  };

  // Only admins can access reports
  if (user?.role !== 'admin') {
    return <div className="unauthorized-message">Only administrators can access reports.</div>;
  }
  return (
    <div className="attendance-report-container">
      <h2>Daily Attendance Reports</h2>
      <p className="report-description">
        Track employee attendance, work hours, and productivity with detailed reports
      </p>
      
      <form onSubmit={generateReport} className="report-form">
        <div className="form-row">
          <div className="form-group">
            <label>Report Type</label>
            <div className="report-type-selector">
              <label className={`report-type-option ${reportType === 'daily' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  value="daily"
                  checked={reportType === 'daily'}
                  onChange={() => setReportType('daily')}
                />
                Daily Report
              </label>
              <label className={`report-type-option ${reportType === 'weekly' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  value="weekly"
                  checked={reportType === 'weekly'}
                  onChange={() => setReportType('weekly')}
                />
                Weekly Report
              </label>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="electrician">Electrician</label>
            <select
              id="electrician"
              value={selectedElectrician}
              onChange={(e) => setSelectedElectrician(e.target.value)}
            >
              <option value="all">All Electricians</option>
              {electricians.map(elec => (
                <option key={elec._id} value={elec._id}>
                  {elec.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="form-row">
          {reportType === 'daily' ? (
            <div className="form-group">
              <label htmlFor="date">Select Date</label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="week">Select Week</label>
              <input
                type="week"
                id="week"
                value={week}
                onChange={(e) => setWeek(e.target.value)}
                max={getWeekValue()}
              />
            </div>
          )}
          
          <div className="form-group checkbox-group">
            <label className="checkbox-container">
              <input
                type="checkbox"
                checked={detailedView}
                onChange={() => setDetailedView(!detailedView)}
              />
              <span className="checkmark"></span>
              Show Detailed Logs
            </label>
          </div>
        </div>
        
        <div className="form-actions">
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </form>
        {reportData && (
        <div className="report-results">
          <div className="report-header">
            <h3>{reportData.title}</h3>
            <p>Generated: {new Date(reportData.generatedAt).toLocaleString()}</p>
            <div className="report-actions">
              <button 
                className="btn btn-secondary"
                onClick={exportToCSV}
              >
                <i className="fa fa-download"></i> Export to CSV
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => window.print()}
              >
                <i className="fa fa-print"></i> Print Report
              </button>
            </div>
          </div>
          
          <div className="report-summary">
            <div className="summary-card">
              <h4>Total Electricians</h4>
              <p className="summary-number">{reportData.electriciansCount}</p>
            </div>
            <div className="summary-card">
              <h4>Total Time Logs</h4>
              <p className="summary-number">{reportData.timeLogsCount}</p>
            </div>
            <div className="summary-card">
              <h4>Total Hours</h4>
              <p className="summary-number">{reportData.totalHours}</p>
              <p className="summary-label">Hours Worked</p>
            </div>
            <div className="summary-card">
              <h4>Avg. Per Person</h4>
              <p className="summary-number">
                {reportData.electriciansCount > 0 
                  ? (reportData.totalHours / reportData.electriciansCount).toFixed(1) 
                  : '0'}
              </p>
              <p className="summary-label">Hours/Person</p>
            </div>
          </div>
          
          <div className="report-table-container">
            <h4>Electrician Attendance Summary</h4>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Total Hours</th>
                  <th>Log Count</th>
                  <th>Avg. Hours/Day</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {reportData.electricians.map((electrician, index) => (
                  <tr key={index}>
                    <td>{electrician.name}</td>
                    <td>{electrician.email}</td>
                    <td>{electrician.totalHours}</td>
                    <td>{electrician.logCount}</td>
                    <td>
                      {electrician.logCount > 0 
                        ? (electrician.totalHours / electrician.logCount).toFixed(1)
                        : '0'}
                    </td>
                    <td>
                      <span className={`status-badge ${
                        electrician.totalHours >= 8 ? 'status-good' : 
                        electrician.totalHours > 0 ? 'status-warning' : 'status-bad'
                      }`}>
                        {electrician.totalHours >= 8 ? 'Full Day' : 
                         electrician.totalHours > 0 ? 'Partial' : 'Absent'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {detailedView && reportData.detailedLogs && (
            <div className="detailed-logs-container">
              <h4>Detailed Time Logs</h4>
              <table className="report-table detailed-table">
                <thead>
                  <tr>
                    <th>Electrician</th>
                    <th>Job</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Duration (hrs)</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.detailedLogs.map((log, index) => (
                    <tr key={index}>
                      <td>{log.electricianName}</td>
                      <td>{log.jobName || log.jobId}</td>
                      <td>{new Date(log.checkInTime).toLocaleTimeString()}</td>
                      <td>{log.checkOutTime 
                        ? new Date(log.checkOutTime).toLocaleTimeString()
                        : 'Active'}</td>
                      <td>{(log.duration / 60).toFixed(2)}</td>
                      <td>{log.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AttendanceReport; 