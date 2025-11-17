import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FaFileInvoiceDollar, FaEye, FaEdit, FaFileDownload, FaPlus } from 'react-icons/fa';
import api from '../../config/axios';
import { toast } from 'react-toastify';
import './InvoiceList.css';

const InvoiceList = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  
  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const res = await api.get('/invoices', { params });
      
      if (res.data.success) {
        setInvoices(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);
  
  const statusBadgeClass = (status) => {
    switch (status) {
      case 'Draft': return 'status-draft';
      case 'Pending Approval': return 'status-pending';
      case 'Approved': return 'status-approved';
      case 'Rejected': return 'status-rejected';
      case 'Paid': return 'status-paid';
      default: return '';
    }
  };
  
  const downloadInvoice = async (id) => {
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
  
  return (
    <div className="invoice-list-container">
      <div className="invoice-list-header">
        <h2>Invoices</h2>
        <Link to="/invoices/create" className="btn btn-primary">
          <FaPlus /> Create Invoice
        </Link>
      </div>
      
      <div className="invoice-filters">
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={`filter-tab ${filter === 'Draft' ? 'active' : ''}`}
            onClick={() => setFilter('Draft')}
          >
            Draft
          </button>
          <button 
            className={`filter-tab ${filter === 'Pending Approval' ? 'active' : ''}`}
            onClick={() => setFilter('Pending Approval')}
          >
            Pending
          </button>
          <button 
            className={`filter-tab ${filter === 'Approved' ? 'active' : ''}`}
            onClick={() => setFilter('Approved')}
          >
            Approved
          </button>
          <button 
            className={`filter-tab ${filter === 'Paid' ? 'active' : ''}`}
            onClick={() => setFilter('Paid')}
          >
            Paid
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="loading-spinner">Loading invoices...</div>
      ) : invoices.length === 0 ? (
        <div className="no-invoices">
          <FaFileInvoiceDollar size={48} />
          <h3>No Invoices Found</h3>
          <p>
            {filter !== 'all' 
              ? `No invoices with status '${filter}' found.` 
              : 'No invoices have been created yet.'}
          </p>
          <Link to="/invoices/create" className="btn btn-primary">
            Create Your First Invoice
          </Link>
        </div>
      ) : (
        <div className="invoice-table-container">
          <table className="invoice-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Client/Job</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(invoice => (
                <tr key={invoice._id}>
                  <td>{invoice.invoiceNumber}</td>
                  <td>
                    {invoice.job ? (
                      <div>
                        <div className="job-client">{invoice.job.client?.name || 'N/A'}</div>
                        <div className="job-title">{invoice.job.title}</div>
                      </div>
                    ) : 'N/A'}
                  </td>
                  <td>
                    {new Date(invoice.createdAt).toLocaleDateString()}
                  </td>
                  <td className="invoice-amount">
                    {formatCurrency(invoice.totalAmount)}
                  </td>
                  <td>
                    <span className={`status-badge ${statusBadgeClass(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="invoice-actions">
                    <Link to={`/invoices/${invoice._id}`} className="btn-icon" title="View Invoice">
                      <FaEye />
                    </Link>
                    
                    {invoice.status === 'Draft' && (
                      <Link to={`/invoices/${invoice._id}/edit`} className="btn-icon" title="Edit Invoice">
                        <FaEdit />
                      </Link>
                    )}
                    
                    <button 
                      className="btn-icon" 
                      title="Download PDF"
                      onClick={() => downloadInvoice(invoice._id)}
                    >
                      <FaFileDownload />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default InvoiceList;