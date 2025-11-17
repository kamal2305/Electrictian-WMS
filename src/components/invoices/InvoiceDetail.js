import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../config/axios';
import { toast } from 'react-toastify';
import { formatCurrency } from '../../utils/formatters';
import './InvoiceDetail.css';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/invoices/${id}`);
        setInvoice(res.data.data);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to fetch invoice details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInvoice();
  }, [id]);
  
  const handleStatusChange = async (newStatus) => {
    try {
      await api.put(`/invoices/${id}/status`, { status: newStatus });
      toast.success(`Invoice status updated to ${newStatus}`);
      
      // Update local state to reflect change
      setInvoice(prev => ({
        ...prev,
        status: newStatus
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update invoice status');
    }
  };
  
  const handleDeleteInvoice = async () => {
    if (window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      try {
        await api.delete(`/invoices/${id}`);
        toast.success('Invoice deleted successfully');
        navigate('/invoices');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete invoice');
      }
    }
  };
  
  const handlePrintInvoice = async () => {
    try {
      const res = await api.get(`/invoices/${id}/print`, { responseType: 'blob' });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${invoice.invoiceNumber}.pdf`);
      
      // Append to html link element
      document.body.appendChild(link);
      
      // Start download
      link.click();
      
      // Clean up and remove the link
      link.parentNode.removeChild(link);
    } catch (err) {
      toast.error('Failed to generate invoice PDF');
      console.error(err);
    }
  };
  
  if (loading) {
    return <div className="loading">Loading invoice details...</div>;
  }
  
  if (!invoice) {
    return (
      <div className="invoice-not-found">
        <h2>Invoice Not Found</h2>
        <p>The requested invoice could not be found.</p>
        <Link to="/invoices" className="btn btn-primary">Back to Invoices</Link>
      </div>
    );
  }
  
  const { status, invoiceNumber, job, createdAt, issueDate, dueDate, breakdown, totalAmount, notes, termsAndConditions, createdBy, updatedAt } = invoice;
  
  // Calculate overdue status
  const dueDateTime = new Date(dueDate).getTime();
  const currentTime = new Date().getTime();
  const isOverdue = status !== 'Paid' && dueDateTime < currentTime;
  
  return (
    <div className="invoice-detail-container">
      <div className="invoice-detail-header">
        <div className="invoice-header-left">
          <h1>Invoice #{invoiceNumber}</h1>
          <div className="invoice-badges">
            <span className={`status-badge ${status.toLowerCase().replace(/\s/g, '-')}`}>
              {status}
            </span>
            {isOverdue && (
              <span className="status-badge overdue">Overdue</span>
            )}
          </div>
        </div>
        
        <div className="invoice-header-actions">
          <button 
            onClick={handlePrintInvoice} 
            className="btn btn-outline"
            title="Print Invoice"
          >
            Print
          </button>
          
          {status === 'Draft' && (
            <Link to={`/invoices/${id}/edit`} className="btn btn-warning" title="Edit Invoice">
              Edit
            </Link>
          )}
          
          {status === 'Draft' && (
            <button 
              onClick={() => handleStatusChange('Pending Approval')} 
              className="btn btn-primary"
            >
              Submit for Approval
            </button>
          )}
          
          {status === 'Pending Approval' && (
            <>
              <button 
                onClick={() => handleStatusChange('Approved')} 
                className="btn btn-success"
              >
                Approve
              </button>
              <button 
                onClick={() => handleStatusChange('Rejected')} 
                className="btn btn-danger"
              >
                Reject
              </button>
            </>
          )}
          
          {status === 'Approved' && (
            <button 
              onClick={() => handleStatusChange('Paid')} 
              className="btn btn-success"
            >
              Mark as Paid
            </button>
          )}
          
          {(status === 'Draft' || status === 'Rejected') && (
            <button 
              onClick={handleDeleteInvoice} 
              className="btn btn-danger"
            >
              Delete
            </button>
          )}
        </div>
      </div>
      
      <div className="invoice-content">
        <div className="invoice-main">
          <div className="invoice-section">
            <h3>Job Details</h3>
            {job ? (
              <div className="job-details">
                <div className="detail-row">
                  <span className="detail-label">Job Title:</span>
                  <span className="detail-value">
                    <Link to={`/jobs/${job._id}`}>{job.title}</Link>
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Job Number:</span>
                  <span className="detail-value">{job.jobNumber}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Client:</span>
                  <span className="detail-value">{job.client ? job.client.name : 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Location:</span>
                  <span className="detail-value">{job.location}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Job Status:</span>
                  <span className="detail-value">{job.status}</span>
                </div>
              </div>
            ) : (
              <p>Job information not available</p>
            )}
          </div>
          
          <div className="invoice-section">
            <h3>Invoice Details</h3>
            <div className="detail-row">
              <span className="detail-label">Invoice Number:</span>
              <span className="detail-value">{invoiceNumber}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Created Date:</span>
              <span className="detail-value">{new Date(createdAt).toLocaleDateString()}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Issue Date:</span>
              <span className="detail-value">{new Date(issueDate).toLocaleDateString()}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Due Date:</span>
              <span className="detail-value">
                {new Date(dueDate).toLocaleDateString()}
                {isOverdue && <span className="overdue-tag"> (Overdue)</span>}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Created By:</span>
              <span className="detail-value">{createdBy ? createdBy.name : 'Unknown'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Last Updated:</span>
              <span className="detail-value">{new Date(updatedAt).toLocaleString()}</span>
            </div>
          </div>
          
          <div className="invoice-section">
            <h3>Financial Breakdown</h3>
            <div className="financial-breakdown">
              <div className="breakdown-item">
                <span className="breakdown-label">Labor Costs:</span>
                <span className="breakdown-value">{formatCurrency(breakdown.laborCosts)}</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">Material Costs:</span>
                <span className="breakdown-value">{formatCurrency(breakdown.materialCosts)}</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">Additional Fees:</span>
                <span className="breakdown-value">{formatCurrency(breakdown.additionalFees || 0)}</span>
              </div>
              <div className="breakdown-item subtotal">
                <span className="breakdown-label">Subtotal:</span>
                <span className="breakdown-value">
                  {formatCurrency(
                    (breakdown.laborCosts || 0) + 
                    (breakdown.materialCosts || 0) + 
                    (breakdown.additionalFees || 0)
                  )}
                </span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">Tax ({breakdown.taxRate || 0}%):</span>
                <span className="breakdown-value">
                  {formatCurrency(
                    ((breakdown.laborCosts || 0) + 
                     (breakdown.materialCosts || 0) + 
                     (breakdown.additionalFees || 0)) * 
                    ((breakdown.taxRate || 0) / 100)
                  )}
                </span>
              </div>
              <div className="breakdown-item total">
                <span className="breakdown-label">Total Amount:</span>
                <span className="breakdown-value">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>
          
          {breakdown.lineItems && breakdown.lineItems.length > 0 && (
            <div className="invoice-section">
              <h3>Line Items</h3>
              <table className="line-items-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdown.lineItems.map((item, index) => (
                    <tr key={index}>
                      <td>{item.description}</td>
                      <td>{item.quantity}</td>
                      <td>{formatCurrency(item.unitPrice)}</td>
                      <td>{formatCurrency(item.quantity * item.unitPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {notes && (
            <div className="invoice-section">
              <h3>Notes</h3>
              <div className="invoice-notes">
                {notes}
              </div>
            </div>
          )}
          
          {termsAndConditions && (
            <div className="invoice-section">
              <h3>Terms and Conditions</h3>
              <div className="invoice-terms">
                {termsAndConditions}
              </div>
            </div>
          )}
        </div>
        
        <div className="invoice-sidebar">
          <div className="invoice-status-card">
            <h3>Payment Status</h3>
            <div className="status-indicator">
              <div className={`status-circle ${status.toLowerCase().replace(/\s/g, '-')}`}></div>
              <span className="status-text">{status}</span>
            </div>
            
            <div className="payment-due">
              <div className="due-label">Due Date</div>
              <div className="due-date">
                {new Date(dueDate).toLocaleDateString()}
                {isOverdue && <span className="overdue-indicator"> (Overdue)</span>}
              </div>
            </div>
            
            <div className="payment-amount">
              <div className="amount-label">Amount</div>
              <div className="amount-value">{formatCurrency(totalAmount)}</div>
            </div>
            
            {status === 'Paid' && (
              <div className="payment-complete">
                <div className="checkmark">✓</div>
                <span>Payment Completed</span>
              </div>
            )}
          </div>
          
          <div className="action-buttons">
            <Link to="/invoices" className="btn btn-secondary btn-block">
              Back to Invoices
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetail;