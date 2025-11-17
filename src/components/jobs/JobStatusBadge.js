import React from 'react';
import './JobStatusBadge.css';

const JobStatusBadge = ({ status }) => {
  const getStatusClass = () => {
    switch (status) {
      case 'Not Started':
        return 'status-not-started';
      case 'In Progress':
        return 'status-in-progress';
      case 'Completed':
        return 'status-completed';
      default:
        return '';
    }
  };

  return (
    <span className={`status-badge ${getStatusClass()}`}>
      {status}
    </span>
  );
};

export default JobStatusBadge; 