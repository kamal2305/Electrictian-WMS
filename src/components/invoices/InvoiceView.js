import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaEdit, FaFileDownload, FaArrowLeft } from 'react-icons/fa';
import api from '../../config/axios';
import { toast } from 'react-toastify';
import './InvoiceView.css';

const InvoiceView = () => {
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
      } catch (error) {
        console.error('Error fetching invoice:', error);
        toast.error('Failed to load invoice');
        navigate('/invoices');
      } finally {
        setLoading(false);
      }
    };
    
    fetchInvoice();
  }, [id, navigate]);
  
  const downloadInvoice = async () => {
    try {
      window.open(`${api.defaults.baseURL}/invoices/${id}/pdf`, '_blank');
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Failed to download invoice');
    }
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  const getStatusClass = (status) => {
    switch (status) {
      case 'Draft': return 'status-draft';
      case 'Pending Approval': return 'status-pending';
      case 'Approved': return 'status-approved';
      case 'Rejected': return 'status-rejected';
      case 'Paid': return 'status-paid';
      default: return '';
    }
  };
  
  if (loading) {
    return <div className="loading">Loading invoice details...</div>;
  }
  
  if (!invoice) {
    return <div className="invoice-error">Invoice not found</div>;
  }
  
  return (
    <div className="invoice-view-container">
      <div className="invoice-view-header">
        <div className="header-left">
          <Link to="/invoices" className="back-link">
            <FaArrowLeft /> Back to Invoices
          </Link>
          <h2>Invoice #{invoice.invoiceNumber}</h2>
          <span className={`status-badge ${getStatusClass(invoice.status)}`}>
            {invoice.status}
          </span>
        </div>
        <div className="header-actions">
          {invoice.status === 'Draft' && (
            <Link to={`/invoices/${id}/edit`} className="btn btn-secondary">
              <FaEdit /> Edit Invoice
            </Link>
          )}
          <button onClick={downloadInvoice} className="btn btn-primary">
            <FaFileDownload /> Download PDF
          </button>
        </div>
      </div>
      
      <div className="invoice-details">
        <div className="invoice-info-section">
          <div className="info-col">
            <h3>Client Information</h3>
            <p className="client-name">
              {invoice.job?.client?.name || 'No client information'}
            </p>
            {invoice.job?.client?.address && (
              <p className="client-address">{invoice.job.client.address}</p>
            )}
            {invoice.job?.client?.email && (
              <p className="client-email">{invoice.job.client.email}</p>
            )}
            {invoice.job?.client?.phone && (
              <p className="client-phone">{invoice.job.client.phone}</p>
            )}
          </div>
          
          <div className="info-col">
            <h3>Invoice Details</h3>
            <div className="detail-row">
              <span>Invoice Date:</span>
              <span>{formatDate(invoice.issueDate)}</span>
            </div>
            <div className="detail-row">
              <span>Due Date:</span>
              <span>{formatDate(invoice.dueDate)}</span>
            </div>
            <div className="detail-row">
              <span>Job:</span>
              <span>{invoice.job?.title || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span>Job Number:</span>
              <span>{invoice.job?.jobNumber || 'N/A'}</span>
            </div>
          </div>
        </div>
        
        {invoice.timeEntries && invoice.timeEntries.length > 0 && (
          <div className="invoice-section">
            <h3>Labor Charges</h3>
            <div className="table-responsive">
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th>Electrician</th>
                    <th>Hours</th>
                    <th>Rate ($/hr)</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.timeEntries.map((entry, index) => (
                    <tr key={index}>
                      <td>{entry.electricianName}</td>
                      <td>{entry.hours.toFixed(2)}</td>
                      <td>{formatCurrency(entry.rate)}</td>
                      <td>{formatCurrency(entry.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {invoice.materials && invoice.materials.length > 0 && (
          <div className="invoice-section">
            <h3>Materials</h3>
            <div className="table-responsive">
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.materials.map((item, index) => (
                    <tr key={index}>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>{formatCurrency(item.unitPrice)}</td>
                      <td>{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        <div className="invoice-section">
          <h3>Summary</h3>
          <div className="invoice-summary">
            <div className="summary-row">
              <span>Labor:</span>
              <span>{formatCurrency(invoice.breakdown.laborCosts)}</span>
            </div>
            <div className="summary-row">
              <span>Materials:</span>
              <span>{formatCurrency(invoice.breakdown.materialCosts)}</span>
            </div>
            {invoice.breakdown.additionalFees > 0 && (
              <div className="summary-row">
                <span>Additional Fees:</span>
                <span>{formatCurrency(invoice.breakdown.additionalFees)}</span>
              </div>
            )}
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>
                {formatCurrency(
                  Number(invoice.breakdown.laborCosts) + 
                  Number(invoice.breakdown.materialCosts) + 
                  Number(invoice.breakdown.additionalFees || 0)
                )}
              </span>
            </div>
            <div className="summary-row">
              <span>Tax ({invoice.breakdown.taxRate}%):</span>
              <span>
                {formatCurrency(
                  (Number(invoice.breakdown.laborCosts) + 
                   Number(invoice.breakdown.materialCosts) + 
                   Number(invoice.breakdown.additionalFees || 0)) * 
                  (Number(invoice.breakdown.taxRate) / 100)
                )}
              </span>
            </div>
            <div className="summary-row total">
              <span>Total:</span>
              <span>{formatCurrency(invoice.totalAmount)}</span>
            </div>
          </div>
        </div>
        
        {invoice.notes && (
          <div className="invoice-section">
            <h3>Notes</h3>
            <p className="invoice-notes">{invoice.notes}</p>
          </div>
        )}
        
        <div className="invoice-section">
          <h3>Terms & Conditions</h3>
          <p className="invoice-terms">{invoice.termsAndConditions}</p>
        </div>
      </div>
    </div>
  );
};

export default InvoiceView;
