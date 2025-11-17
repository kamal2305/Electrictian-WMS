import React from 'react';
import PropTypes from 'prop-types';
import './RealtimeStatus.css';

/**
 * RealtimeStatus component displays the last refresh time and provides a refresh button
 * for components that need to show real-time data refresh status.
 */
const RealtimeStatus = ({ 
  lastRefreshed, 
  onRefresh, 
  isRefreshing, 
  refreshInterval 
}) => {
  // Format the time difference in a human-readable way
  const getTimeDifference = () => {
    const now = new Date();
    const diffMs = now - new Date(lastRefreshed);
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 60) {
      return `${diffSecs} seconds ago`;
    } else if (diffSecs < 3600) {
      return `${Math.floor(diffSecs / 60)} minutes ago`;
    } else {
      return `${Math.floor(diffSecs / 3600)} hours ago`;
    }
  };
  
  return (
    <div className="realtime-status">
      <div className="refresh-info">
        <div className="last-updated">
          <span className="status-label">Last updated:</span>
          <span className="time">{lastRefreshed.toLocaleTimeString()}</span>
          <span className="date">{lastRefreshed.toLocaleDateString()}</span>
          <span className="ago">({getTimeDifference()})</span>
        </div>
        
        {refreshInterval && (
          <div className="auto-refresh-info">
            <span className="status-label">Auto-refresh:</span>
            <span className="interval">Every {Math.floor(refreshInterval / 60000)} minutes</span>
          </div>
        )}
      </div>
      
      <button 
        className="btn btn-primary refresh-btn" 
        onClick={onRefresh} 
        disabled={isRefreshing}
      >
        {isRefreshing ? (
          <>
            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            Refreshing...
          </>
        ) : 'Refresh Now'}
      </button>
    </div>
  );
};

RealtimeStatus.propTypes = {
  lastRefreshed: PropTypes.instanceOf(Date).isRequired,
  onRefresh: PropTypes.func.isRequired,
  isRefreshing: PropTypes.bool,
  refreshInterval: PropTypes.number
};

RealtimeStatus.defaultProps = {
  isRefreshing: false
};

export default RealtimeStatus;
