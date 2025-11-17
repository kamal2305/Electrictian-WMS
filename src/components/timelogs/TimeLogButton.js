import React, { useState, useEffect } from 'react';
import api from '../../config/axios'; // Import our configured axios instance
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';
import './TimeLogButton.css';

const TimeLogButton = ({ jobId }) => {
  const { user } = useAuth();
  const [activeTimeLog, setActiveTimeLog] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);  const [notes, setNotes] = useState('');
  const [elapsedTime, setElapsedTime] = useState('Calculating...');
  const [manualMode, setManualMode] = useState(false);
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  
  // Set default datetime values when toggling to manual mode
  useEffect(() => {
    if (manualMode) {
      const now = new Date();
      // Format date for datetime-local input: YYYY-MM-DDThh:mm
      const formattedDate = now.toISOString().slice(0, 16);
      setCheckInTime(formattedDate);
    }
  }, [manualMode]);// Update elapsed time when there's an active log
  useEffect(() => {
    let intervalId;
    
    if (activeTimeLog) {
      // Define the update function
      const updateElapsedTime = () => {
        const startTime = new Date(activeTimeLog.checkInTime);
        const now = new Date();
        const elapsedMs = now - startTime;
        const elapsedMin = Math.floor(elapsedMs / (1000 * 60));
        const hours = Math.floor(elapsedMin / 60);
        const minutes = elapsedMin % 60;
        
        setElapsedTime(hours > 0 ? `${hours}h ${minutes}m` : `${minutes} minute${minutes !== 1 ? 's' : ''}`);
      };
      
      // Update immediately and then every minute
      updateElapsedTime();
      intervalId = setInterval(updateElapsedTime, 60000); // Update every minute
    }
    
    // Clean up on unmount or when activeTimeLog changes
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeTimeLog]);

  // Check if there's an active time log for this job when component mounts
  useEffect(() => {
    const checkActiveTimeLog = async () => {      try {        // Use the job routes to get time logs
        console.log(`Checking for active time logs for job ${jobId}`);
        const response = await api.get(`/jobs/${jobId}/timelogs`);
        console.log('Time logs response:', response.data);
        
        // Filter to get only active logs for current user
        const activeLogs = response.data.data.filter(
          log => log.status === 'Active' && 
                log.electrician._id === user.id
        );
        
        if (activeLogs.length > 0) {
          setActiveTimeLog(activeLogs[0]);
          console.log('Found active time log:', activeLogs[0]);
        }
        setCheckingStatus(false);
      } catch (error) {
        console.error('Error checking active time log:', error);
        toast.error('Failed to check active time logs');
        setCheckingStatus(false);
      }
    };

    if (user?.role === 'electrician' && jobId) {
      checkActiveTimeLog();
    } else {
      setCheckingStatus(false);
    }
  }, [jobId, user]);  const handleCheckIn = async () => {
    setLoading(true);
    try {
      if (manualMode) {
        const checkInDateTime = new Date(checkInTime);
        if (isNaN(checkInDateTime.getTime())) {
          throw new Error('Invalid check-in time');
        }
        
        const response = await api.post(`/jobs/${jobId}/checkin`, { 
          notes,
          manualCheckIn: true,
          checkInTime: checkInDateTime
        });
        setActiveTimeLog(response.data.data);
        toast.success('Manual check-in recorded successfully');
      } else {
        const response = await api.post(`/jobs/${jobId}/checkin`, { notes });
        setActiveTimeLog(response.data.data);
        toast.success('Checked in successfully');
      }
      setNotes('');
    } catch (error) {
      console.error('Check-in error:', error);
      
      // Provide more detailed error messages based on server response
      const errorMessage = error.response?.data?.message || 'Failed to check in';
      
      // Show more user-friendly error messages
      if (errorMessage.includes('already checked in')) {
        toast.error('You are already checked in to this job');
      } else if (errorMessage.includes('not assigned')) {
        toast.error('You are not assigned to this job');
      } else if (errorMessage.includes('completed job')) {
        toast.error('Cannot check in to a completed job');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };  const handleCheckOut = async () => {
    setLoading(true);
    try {
      console.log(`Checking out time log ${activeTimeLog._id}`);
      
      let response;
      if (manualMode) {
        const checkOutDateTime = new Date(checkOutTime);
        if (isNaN(checkOutDateTime.getTime())) {
          throw new Error('Invalid check-out time');
        }
        
        response = await api.put(`/timelogs/${activeTimeLog._id}/checkout`, { 
          notes,
          manualCheckOut: true,
          checkOutTime: checkOutDateTime
        });
      } else {
        response = await api.put(`/timelogs/${activeTimeLog._id}/checkout`, { notes });
      }
      
      // Get the formatted duration if available, otherwise use our own formatting
      let formattedDuration = response.data.data.formattedDuration;
      
      if (!formattedDuration) {
        const duration = response.data.data.duration;
        if (duration >= 60) {
          const hours = Math.floor(duration / 60);
          const minutes = duration % 60;
          formattedDuration = `${hours} hour${hours !== 1 ? 's' : ''} and ${minutes} minute${minutes !== 1 ? 's' : ''}`;
        } else {
          formattedDuration = `${duration} minute${duration !== 1 ? 's' : ''}`;
        }
      }
      
      setActiveTimeLog(null);
      setManualMode(false);
      setCheckInTime('');
      setCheckOutTime('');
      toast.success(`Checked out successfully. You worked for ${formattedDuration}`);
      setNotes('');
    } catch (error) {
      console.error('Check-out error:', error);
      toast.error(error.response?.data?.message || 'Failed to check out');
    } finally {
      setLoading(false);
    }
  };
  
  const handleManualEntryToggle = () => {
    setManualMode(!manualMode);
  };

  // Only show for electricians
  if (user?.role !== 'electrician') {
    return null;
  }

  // Show loading indicator while checking status
  if (checkingStatus) {
    return <div className="time-log-loading">Checking status...</div>;
  }
  return (
    <div className="time-log-container">
      <h3>Time Tracking</h3>
      
      <div className="time-log-control">
        <label className="manual-entry-toggle">
          <input 
            type="checkbox" 
            checked={manualMode} 
            onChange={handleManualEntryToggle} 
            disabled={activeTimeLog !== null}
          />
          Manual time entry
        </label>
      </div>
      
      <div className="notes-field">
        <textarea
          placeholder="Add notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
      </div>
      
      {activeTimeLog ? (
        <div className="active-time-log">
          <p>
            <span className="status-badge active">Active</span>
            Checked in at: {new Date(activeTimeLog.checkInTime).toLocaleTimeString()} on {new Date(activeTimeLog.checkInTime).toLocaleDateString()}
          </p>
          <p className="time-elapsed">
            <strong>Time Elapsed:</strong> <span className="elapsed-time">{elapsedTime}</span>
          </p>
          
          {manualMode && (
            <div className="manual-time-fields">
              <div className="form-group">
                <label>Check-out Time:</label>
                <input 
                  type="datetime-local" 
                  className="form-control"
                  value={checkOutTime} 
                  onChange={(e) => setCheckOutTime(e.target.value)} 
                />
              </div>
            </div>
          )}
          
          <button 
            className="btn btn-danger" 
            onClick={handleCheckOut} 
            disabled={loading || (manualMode && !checkOutTime)}
          >
            {loading ? 'Processing...' : 'Check Out'}
          </button>
        </div>
      ) : (
        <div>
          {manualMode ? (
            <div className="manual-time-fields">
              <div className="form-group">
                <label>Check-in Time:</label>
                <input 
                  type="datetime-local" 
                  className="form-control"
                  value={checkInTime} 
                  onChange={(e) => setCheckInTime(e.target.value)} 
                />
              </div>
              
              <div className="form-group">
                <label>Check-out Time (Optional):</label>
                <input 
                  type="datetime-local" 
                  className="form-control"
                  value={checkOutTime} 
                  onChange={(e) => setCheckOutTime(e.target.value)} 
                />
              </div>
              
              <button 
                className="btn btn-success" 
                onClick={handleCheckIn} 
                disabled={loading || !checkInTime}
              >
                {loading ? 'Processing...' : 'Submit Time Entry'}
              </button>
            </div>
          ) : (
            <button 
              className="btn btn-success" 
              onClick={handleCheckIn} 
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Check In'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TimeLogButton; 