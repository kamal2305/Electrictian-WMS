// Utility functions for formatting values consistently across the application
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(value);
};

export const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-IN', options);
};

export const formatDateTime = (dateString) => {
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Date(dateString).toLocaleDateString('en-IN', options);
};

export const getStatusColor = (status) => {
  const statusMap = {
    'Pending': 'var(--status-warning)',
    'In Progress': 'var(--status-info)',
    'Completed': 'var(--status-success)',
    'Cancelled': 'var(--text-light)',
    'Overdue': 'var(--status-error)',
    'Paid': 'var(--status-success)',
    'Unpaid': 'var(--status-warning)',
    'Partially Paid': 'var(--status-info)'
  };
  
  return statusMap[status] || 'var(--text-medium)';
};

export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

export const calculateTotal = (items, field) => {
  return items.reduce((total, item) => total + (parseFloat(item[field]) || 0), 0);
};

// Calculate time duration in hours and minutes
export const calculateDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return '0h 0m';
  
  const start = new Date(startTime);
  const end = new Date(endTime);
  const durationMs = end - start;
  
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}m`;
};

// Format percentage with specified decimal places
export const formatPercentage = (value, decimalPlaces = 1) => {
  return `${value.toFixed(decimalPlaces)}%`;
};