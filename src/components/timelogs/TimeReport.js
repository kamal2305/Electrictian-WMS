import React, { useState } from 'react';
import api from '../../config/axios';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';
import './TimeReport.css';

const TimeReport = () => {
  const { user } = useAuth();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('daily');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [week, setWeek] = useState(getWeekValue());

  // Calculate current week value for the input
  function getWeekValue() {
    const now = new Date();
    const onejan = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil((((now - onejan) / 86400000) + onejan.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
  }
  const generateReport = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {      // For time reports, use the hours endpoint
      const params = reportType === 'daily' ? 
        { startDate: date, endDate: date } : 
        { 
          startDate: formatWeekToDate(week),
          endDate: formatWeekEndDate(week)
        };
      
      const response = await api.get('/reports/hours', { params });
      
      // Also fetch attendance data to provide a complete view
      const attendanceParams = reportType === 'daily' ? { date } : { week: formatWeekToDate(week) };
      const attendanceResponse = await api.get('/timelogs/reports/attendance', { params: attendanceParams });
      
      // Combine both datasets
      const combinedData = {
        ...response.data.data,
        electricians: attendanceResponse.data.data.electricians,
        timeLogsCount: attendanceResponse.data.data.timeLogsCount,
        electriciansCount: attendanceResponse.data.data.electriciansCount
      };
      
      setReportData(combinedData);
      toast.success('Time report generated successfully');
    } catch (error) {
      console.error('Error generating time report:', error);
      toast.error(error.response?.data?.message || 'Failed to generate time report');
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

  // Calculate the end of week date from week string
  function formatWeekEndDate(weekStr) {
    const startDate = new Date(formatWeekToDate(weekStr));
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6); // Add 6 days to get to end of week
    return endDate.toISOString().split('T')[0];
  }
  // Export to CSV
  const exportToCSV = () => {
    if (!reportData) return;
    
    // Prepare CSV content
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    // Report summary
    csvContent += 'Time Report Summary\n';
    csvContent += `Report Type,${reportType === 'daily' ? 'Daily' : 'Weekly'}\n`;
    csvContent += `Date,${reportType === 'daily' ? date : week}\n`;
    csvContent += `Total Hours,${reportData.totalHours}\n`;
    csvContent += `Total Electricians,${reportData.electriciansCount || 0}\n`;
    csvContent += `Total Time Logs,${reportData.timeLogsCount || 0}\n\n`;
    
    // Daily hours section
    csvContent += 'Daily Hours Breakdown\n';
    csvContent += 'Date,Total Hours\n';
    
    // Add daily data
    reportData.byDay.forEach(day => {
      csvContent += `${day.date},${day.hours}\n`;
    });
    
    // Electrician breakdown section
    csvContent += '\nElectrician Hours Breakdown\n';
    
    if (reportData.electricians) {
      // Include detailed electrician data if available
      csvContent += 'Name,Hours,Log Count,Email\n';
      reportData.electricians.forEach(electrician => {
        csvContent += `${electrician.name},${electrician.totalHours},${electrician.logCount},${electrician.email}\n`;
      });
    } else {
      // Fallback to basic electrician data
      csvContent += 'Name,Hours\n';
      reportData.byElectrician.forEach(electrician => {
        csvContent += `${electrician.name},${electrician.hours}\n`;
      });
    }
    
    // Encode and trigger download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Time_Report_${reportType === 'daily' ? date : week}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Time report exported to CSV');
  };

  // Only admins can access reports
  if (user?.role !== 'admin') {
    return <div className="unauthorized-message">Only administrators can access time reports.</div>;
  }

  return (    <div className="time-report-container">
      <h2>Time & Attendance Reports</h2>
      
      <form onSubmit={generateReport} className="report-form">
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
        
        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
      </form>
      
      {reportData && (
        <div className="report-results">
          <div className="report-header">
            <h3>Time Report {reportType === 'daily' ? `for ${new Date(date).toLocaleDateString()}` : `for Week ${week}`}</h3>
            <button 
              className="btn btn-secondary"
              onClick={exportToCSV}
            >
              Export to CSV
            </button>
          </div>
              <div className="report-summary">
            <div className="summary-card">
              <h4>Total Hours</h4>
              <p className="summary-number">{reportData.totalHours}</p>
            </div>
            <div className="summary-card">
              <h4>Total Electricians</h4>
              <p className="summary-number">{reportData.electriciansCount || 0}</p>
            </div>
            <div className="summary-card">
              <h4>Total Time Logs</h4>
              <p className="summary-number">{reportData.timeLogsCount || 0}</p>
            </div>
          </div>
          
          <div className="report-section">
            <h4>Hours by Day</h4>
            <div className="report-table-container">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.byDay.map((day, index) => (
                    <tr key={index}>
                      <td>{new Date(day.date).toLocaleDateString()}</td>
                      <td>{day.hours}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="report-section">
            <h4>Hours by Electrician</h4>
            <div className="report-table-container">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Electrician</th>
                    <th>Hours</th>
                    <th>Log Count</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.electricians ? (
                    reportData.electricians.map((electrician, index) => (
                      <tr key={index}>
                        <td>{electrician.name}</td>
                        <td>{electrician.totalHours}</td>
                        <td>{electrician.logCount}</td>
                        <td>{electrician.email}</td>
                      </tr>
                    ))
                  ) : (
                    reportData.byElectrician.map((electrician, index) => (
                      <tr key={index}>
                        <td>{electrician.name}</td>
                        <td>{electrician.hours}</td>
                        <td>-</td>
                        <td>-</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeReport;
