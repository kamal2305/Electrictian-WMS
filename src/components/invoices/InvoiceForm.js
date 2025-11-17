import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../../config/axios';
import { toast } from 'react-toastify';
import { calculateTax, calculateTotal, calculateSubtotal, formatCurrency } from '../../utils/calculations';
import './InvoiceForm.css';

const InvoiceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = Boolean(id);
  const preSelectedJobId = location.state?.jobId;
  
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [jobLoading, setJobLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [timeLogs, setTimeLogs] = useState([]);
  const [materials, setMaterials] = useState([]);
  
  const [formData, setFormData] = useState({
    job: preSelectedJobId || '',
    invoiceNumber: generateInvoiceNumber(),
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Draft',
    breakdown: {
      laborCosts: 0,
      materialCosts: 0,
      additionalFees: 0,
      taxRate: 10, // Default tax rate: 10%
    },
    timeEntries: [],
    materials: [],
    notes: '',
    termsAndConditions: 'Payment is due within 30 days of invoice date. Late payments are subject to a 1.5% monthly interest.'
  });
  // Generate a random invoice number
  function generateInvoiceNumber() {
    const prefix = 'INV';
    const timestamp = new Date().getTime().toString();
    const lastSix = timestamp.slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${lastSix}-${random}`;
  }

  const getTotalAmount = useCallback(() => {
    const subtotal = calculateSubtotal(formData.breakdown);
    return calculateTotal(subtotal, formData.breakdown.taxRate);
  }, [formData.breakdown]);

  // Fetch jobs for selection
  const fetchJobs = async () => {
    try {
      setJobLoading(true);
      const res = await api.get('/jobs?status=Completed');
      const jobsData = res.data.data || [];
      setJobs(jobsData);
      
      if (preSelectedJobId && jobsData.length > 0) {
        const foundJob = jobsData.find(job => job._id === preSelectedJobId);
        if (foundJob) {
          await fetchJobData(preSelectedJobId);
        }
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load available jobs');
      setJobs([]);
    } finally {
      setJobLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);
  
  // Fetch invoice data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      const fetchInvoice = async () => {
        try {
          setLoading(true);
          const res = await api.get(`/invoices/${id}`);
          const invoice = res.data.data;
          
          // Format dates for form input
          const formattedInvoice = {
            ...invoice,
            issueDate: new Date(invoice.issueDate).toISOString().split('T')[0],
            dueDate: new Date(invoice.dueDate).toISOString().split('T')[0],
          };
          setFormData(formattedInvoice);
          
          // If the invoice has time entries and materials, set them
          if (invoice.timeEntries && invoice.timeEntries.length > 0) {
            setTimeLogs(invoice.timeEntries);
          }
          
          if (invoice.materials && invoice.materials.length > 0) {
            setMaterials(invoice.materials);
          }
        } catch (err) {
          toast.error('Failed to load invoice data');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      
      fetchInvoice();
    }
  }, [id, isEditMode]);
    // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested fields
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear any errors for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
    
    // If changing job, fetch job data
    if (name === 'job' && value) {
      fetchJobData(value);
      
      // Find the selected job object for generating invoice number
      const selectedJobForInvoice = jobs.find(job => job._id === value);
      
      // Generate job-specific invoice number
      if (selectedJobForInvoice) {
        const jobSpecificInvoiceNumber = generateJobBasedInvoiceNumber(selectedJobForInvoice);
        setFormData(prev => ({
          ...prev,
          invoiceNumber: jobSpecificInvoiceNumber
        }));
      }
    }
  };
  
  // Update total amount when breakdown changes
  useEffect(() => {
    const totalAmount = getTotalAmount();
    setFormData(prev => ({
      ...prev,
      totalAmount
    }));
  }, [formData.breakdown, getTotalAmount]);
  
  // Function to fetch job data and populate invoice
  const fetchJobData = async (jobId) => {
    if (!jobId) return;
    
    try {
      setLoading(true);
      
      // Fetch job time logs
      const timeLogsRes = await api.get(`/timelogs/job/${jobId}`);
      const jobMaterialsRes = await api.get(`/jobs/${jobId}/materials`);
      
      if (timeLogsRes.data.success) {
        const logs = timeLogsRes.data.data;
        
        // Process time logs to create invoice entries
        const timeEntries = [];
        let totalLaborCost = 0;
        
        // Group logs by electrician
        const electricianLogs = {};
        
        logs.forEach(log => {
          // Add null safety checks for electrician object
          if (!log || !log.electrician || !log.electrician._id) {
            console.warn('Invalid time log data:', log);
            return; // Skip this log
          }
          
          const electricianId = log.electrician._id;
          
          if (!electricianLogs[electricianId]) {
            electricianLogs[electricianId] = {
              electrician: electricianId,
              electricianName: log.electrician.name || 'Unknown Electrician',
              hours: 0,
              rate: 50, // Default hourly rate - can be customized later
              total: 0
            };
          }
          
          // Calculate hours from minutes
          const hours = (log.duration || 0) / 60;
          electricianLogs[electricianId].hours += hours;
        });
        
        // Create time entries from grouped logs
        Object.values(electricianLogs).forEach(entry => {
          // Round hours to 2 decimal places
          entry.hours = Math.round(entry.hours * 100) / 100;
          entry.total = entry.hours * entry.rate;
          totalLaborCost += entry.total;
          timeEntries.push(entry);
        });
        
        setTimeLogs(timeEntries);
        
        // Process material usage
        const materialItems = [];
        let totalMaterialCost = 0;
        
        if (jobMaterialsRes.data.success) {
          const usedMaterials = jobMaterialsRes.data.data;
          
          usedMaterials.forEach(material => {
            // Add null safety checks for material object
            if (!material || !material.material) {
              console.warn('Invalid material data:', material);
              return; // Skip this material
            }
            
            const item = {
              name: material.material.name || 'Unknown Material',
              quantity: material.quantity || 0,
              unitPrice: material.material.price || 0,
              total: (material.quantity || 0) * (material.material.price || 0)
            };
            totalMaterialCost += item.total;
            materialItems.push(item);
          });
        }
        
        setMaterials(materialItems);
        
        // Update form data with calculated values
        setFormData(prev => ({
          ...prev,
          breakdown: {
            ...prev.breakdown,
            laborCosts: totalLaborCost,
            materialCosts: totalMaterialCost
          },
          timeEntries: timeEntries,
          materials: materialItems,
          totalAmount: totalLaborCost + totalMaterialCost
        }));
      }
    } catch (error) {
      console.error('Error fetching job data:', error);
      toast.error('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };
    // This duplicate jobs fetch was removed to avoid redundancy
  
  // Fetch job details when a job is selected
  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!formData.job) return;
      
      try {
        setLoading(true);
        const response = await api.get(`/jobs/${formData.job}/invoice-data`);
        const data = response.data.data;
        
        // Update time entries
        if (data.labor && data.labor.length > 0) {
          setTimeLogs(data.labor);
        }
        
        // Update materials
        if (data.materials && data.materials.length > 0) {
          setMaterials(data.materials);
        }
        
        // Update form data with totals
        setFormData(prev => ({
          ...prev,
          breakdown: {
            ...prev.breakdown,
            laborCosts: data.totals.labor,
            materialCosts: data.totals.materials
          },
          timeEntries: data.labor || [],
          materials: data.materials || []
        }));
      } catch (error) {
        console.error('Error fetching job details:', error);
        toast.error('Failed to load job details');
      } finally {
        setLoading(false);
      }
    };
    
    if (formData.job) {
      fetchJobDetails();
    }
  }, [formData.job, isEditMode]);  // Generate invoice number based on job details if available
  const generateJobBasedInvoiceNumber = (job) => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const jobPrefix = job?.jobNumber ? job.jobNumber.substring(0, 3) : 'INV';
    
    return `${jobPrefix}-${year}${month}-${random}`;
  };
  
  const validateForm = () => {
    const errors = {};
    
    if (!formData.job) errors.job = 'Please select a job';
    if (!formData.invoiceNumber) errors.invoiceNumber = 'Invoice number is required';
    if (!formData.issueDate) errors.issueDate = 'Issue date is required';
    if (!formData.dueDate) errors.dueDate = 'Due date is required';
    
    const { laborCosts, materialCosts, taxRate } = formData.breakdown;
    if (isNaN(laborCosts) || laborCosts < 0) errors['breakdown.laborCosts'] = 'Invalid labor cost';
    if (isNaN(materialCosts) || materialCosts < 0) errors['breakdown.materialCosts'] = 'Invalid material cost';
    if (isNaN(taxRate) || taxRate < 0 || taxRate > 100) errors['breakdown.taxRate'] = 'Invalid tax rate (0-100%)';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please correct the errors in the form');
      return;
    }
    
    try {
      setLoading(true);
      
      const totalAmount = getTotalAmount();
      const invoiceData = {
        ...formData,
        totalAmount
      };
        if (isEditMode) {
        await api.put(`/invoices/${id}`, invoiceData);
        toast.success('Invoice updated successfully!');
      } else {
        await api.post('/invoices', invoiceData);
        toast.success('Invoice created successfully!');
      }
      
      navigate('/invoices');
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to save invoice. Please check all fields and try again.';
      toast.error(message);
      console.error('Invoice save error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading && isEditMode) {
    return <div className="loading">Loading invoice data...</div>;
  }
  
  return (
    <div className="invoice-form-container">
      <div className="invoice-form-header">
        <h1>{isEditMode ? 'Edit Invoice' : 'Create New Invoice'}</h1>
      </div>
      
      <form onSubmit={handleSubmit} className="invoice-form">
        <div className="form-section">
          <h3>Basic Information</h3>
          
          <div className="form-group">
            <label htmlFor="job">Job *</label>
            <select
              id="job"
              name="job"
              value={formData.job}
              onChange={handleChange}
              disabled={isEditMode || jobLoading}
              className={formErrors.job ? 'error' : ''}
            >
              <option value="">Select a completed job</option>
              {jobs && jobs.length > 0 ? (
                jobs.map(job => (
                  <option key={job._id} value={job._id}>
                    {job.title || 'Untitled'} - {job.jobNumber || 'N/A'} - {job.client?.name || 'No client'}
                  </option>
                ))
              ) : (
                <option disabled>No completed jobs available</option>
              )}
            </select>
            {formErrors.job && <div className="error-text">{formErrors.job}</div>}
            {jobLoading && <div className="loading-text">Loading jobs...</div>}
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="invoiceNumber">Invoice Number *</label>
              <input
                type="text"
                id="invoiceNumber"
                name="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={handleChange}
                className={formErrors.invoiceNumber ? 'error' : ''}
              />
              {formErrors.invoiceNumber && <div className="error-text">{formErrors.invoiceNumber}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={!isEditMode} // Only allow editing status in edit mode
              >
                <option value="Draft">Draft</option>
                <option value="Pending Approval">Pending Approval</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="issueDate">Issue Date *</label>
              <input
                type="date"
                id="issueDate"
                name="issueDate"
                value={formData.issueDate}
                onChange={handleChange}
                className={formErrors.issueDate ? 'error' : ''}
              />
              {formErrors.issueDate && <div className="error-text">{formErrors.issueDate}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="dueDate">Due Date *</label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className={formErrors.dueDate ? 'error' : ''}
              />
              {formErrors.dueDate && <div className="error-text">{formErrors.dueDate}</div>}
            </div>
          </div>
        </div>
          {/* Time Log Details Section */}
        {formData.job && timeLogs.length > 0 && (
          <div className="form-section">
            <h3>Labor Details</h3>
            <div className="table-responsive">
              <table className="detail-table">
                <thead>
                  <tr>
                    <th>Electrician</th>
                    <th>Hours</th>
                    <th>Rate ($/hr)</th>
                    <th>Total ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {timeLogs.map((entry, index) => (
                    <tr key={index}>
                      <td>{entry.electricianName}</td>
                      <td>{entry.hours.toFixed(2)}</td>
                      <td>
                        <input
                          type="number"
                          value={entry.rate}
                          onChange={(e) => {
                            const newRate = parseFloat(e.target.value) || 0;
                            const newTimeLogs = [...timeLogs];
                            newTimeLogs[index].rate = newRate;
                            newTimeLogs[index].total = newRate * newTimeLogs[index].hours;
                            
                            setTimeLogs(newTimeLogs);
                            
                            // Update labor costs
                            const newLaborCosts = newTimeLogs.reduce(
                              (sum, item) => sum + item.total, 0
                            );
                            
                            setFormData(prev => ({
                              ...prev,
                              breakdown: {
                                ...prev.breakdown,
                                laborCosts: newLaborCosts
                              },
                              timeEntries: newTimeLogs
                            }));
                          }}
                          min="0"
                          step="0.01"
                          className="small-input"
                        />
                      </td>
                      <td>${entry.total.toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td colSpan="3"><strong>Total Labor Cost</strong></td>
                    <td><strong>${(parseFloat(formData.breakdown.laborCosts) || 0).toFixed(2)}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Materials Details Section */}
        {formData.job && materials.length > 0 && (
          <div className="form-section">
            <h3>Materials Used</h3>
            <div className="table-responsive">
              <table className="detail-table">
                <thead>
                  <tr>
                    <th>Material Name</th>
                    <th>Quantity</th>
                    <th>Unit Price ($)</th>
                    <th>Total ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((item, index) => (
                    <tr key={index}>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => {
                            const newPrice = parseFloat(e.target.value) || 0;
                            const newMaterials = [...materials];
                            newMaterials[index].unitPrice = newPrice;
                            newMaterials[index].total = newPrice * newMaterials[index].quantity;
                            
                            setMaterials(newMaterials);
                            
                            // Update material costs
                            const newMaterialCosts = newMaterials.reduce(
                              (sum, item) => sum + item.total, 0
                            );
                            
                            setFormData(prev => ({
                              ...prev,
                              breakdown: {
                                ...prev.breakdown,
                                materialCosts: newMaterialCosts
                              },
                              materials: newMaterials
                            }));
                          }}
                          min="0"
                          step="0.01"
                          className="small-input"
                        />
                      </td>
                      <td>${item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td colSpan="3"><strong>Total Material Cost</strong></td>
                    <td><strong>${(parseFloat(formData.breakdown.materialCosts) || 0).toFixed(2)}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="form-section">
          <h3>Financial Breakdown</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="breakdown.laborCosts">Labor Costs ($) *</label>
              <input
                type="number"
                id="breakdown.laborCosts"
                name="breakdown.laborCosts"
                value={formData.breakdown.laborCosts}
                onChange={handleChange}
                step="0.01"
                min="0"
                className={formErrors['breakdown.laborCosts'] ? 'error' : ''}
              />
              {formErrors['breakdown.laborCosts'] && (
                <div className="error-text">{formErrors['breakdown.laborCosts']}</div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="breakdown.materialCosts">Material Costs ($) *</label>
              <input
                type="number"
                id="breakdown.materialCosts"
                name="breakdown.materialCosts"
                value={formData.breakdown.materialCosts}
                onChange={handleChange}
                step="0.01"
                min="0"
                className={formErrors['breakdown.materialCosts'] ? 'error' : ''}
              />
              {formErrors['breakdown.materialCosts'] && (
                <div className="error-text">{formErrors['breakdown.materialCosts']}</div>
              )}
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="breakdown.additionalFees">Additional Fees ($)</label>
              <input
                type="number"
                id="breakdown.additionalFees"
                name="breakdown.additionalFees"
                value={formData.breakdown.additionalFees}
                onChange={handleChange}
                step="0.01"
                min="0"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="breakdown.taxRate">Tax Rate (%)</label>
              <input
                type="number"
                id="breakdown.taxRate"
                name="breakdown.taxRate"
                value={formData.breakdown.taxRate}
                onChange={handleChange}
                step="0.1"
                min="0"
                max="100"
                className={formErrors['breakdown.taxRate'] ? 'error' : ''}
              />
              {formErrors['breakdown.taxRate'] && (
                <div className="error-text">{formErrors['breakdown.taxRate']}</div>
              )}
            </div>
          </div>
          
          <div className="invoice-summary-calculation">
            <div className="calculation-row">
              <span>Subtotal:</span>
              <span>{formatCurrency(calculateSubtotal(formData.breakdown))}</span>
            </div>
            <div className="calculation-row">
              <span>Tax ({formData.breakdown.taxRate}%):</span>
              <span>{formatCurrency(calculateTax(calculateSubtotal(formData.breakdown), formData.breakdown.taxRate))}</span>
            </div>
            <div className="calculation-row total">
              <span>Total Amount:</span>
              <span>{formatCurrency(getTotalAmount())}</span>
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h3>Additional Information</h3>
          
          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Enter any additional notes for this invoice"
              rows="3"
            ></textarea>
          </div>
          
          <div className="form-group">
            <label htmlFor="termsAndConditions">Terms and Conditions</label>
            <textarea
              id="termsAndConditions"
              name="termsAndConditions"
              value={formData.termsAndConditions}
              onChange={handleChange}
              rows="4"
            ></textarea>
          </div>
        </div>
        
        <div className="form-buttons">
          <button
            type="button"
            onClick={() => navigate('/invoices')}
            className="btn btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : (isEditMode ? 'Update Invoice' : 'Create Invoice')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceForm;