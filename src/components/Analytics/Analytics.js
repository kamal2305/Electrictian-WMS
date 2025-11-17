import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import api from '../../config/axios';
import './Analytics.css';
import { Line, Pie as ChartPie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [analyticsData, setAnalyticsData] = useState({
    jobStats: [],
    materialStats: [],
    revenueStats: [],
    electricianStats: [],
    timeLogStats: []
  });

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/analytics');
      console.log('Analytics response:', response.data);
      
      // Handle response structure
      const data = response.data.data || response.data;
      
      setAnalyticsData({
        jobStats: data.jobStats || { totalJobs: 0, completedJobs: 0, statusDistribution: [] },
        materialStats: data.materialStats || { totalItems: 0, lowStockItems: 0, usageByCategory: [] },
        revenueStats: data.revenueStats || { totalRevenue: 0, monthlyGrowth: 0, monthlyData: [] },
        electricianStats: data.electricianStats || { totalElectricians: 0, activeElectricians: 0, topPerformers: [] },
        timeLogStats: data.timeLogStats || { totalHours: 0, averageHours: 0, count: 0 }
      });
      
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError('Failed to fetch analytics data');
      toast.error('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  // Memoize chart data (must be before early returns per hooks rules)
  const revenueChartData = useMemo(() => ({
    labels: analyticsData.revenueStats.monthlyData?.map(item => item.month) || [],
    datasets: [
      {
        label: 'Monthly Revenue',
        data: analyticsData.revenueStats.monthlyData?.map(item => item.revenue) || [],
        borderColor: 'var(--chart-blue)',
        tension: 0.1,
        fill: 'start',
        backgroundColor: 'rgba(108, 120, 131, 0.1)',
      },
    ],
  }), [analyticsData.revenueStats.monthlyData]);

  const jobStatusData = useMemo(() => ({
    labels: analyticsData.jobStats.statusDistribution?.map(item => item.name) || [],
    datasets: [
      {
        data: analyticsData.jobStats.statusDistribution?.map(item => item.value) || [],
        backgroundColor: [
          'var(--chart-green)',
          'var(--chart-blue)',
          'var(--chart-orange)',
        ],
      },
    ],
  }), [analyticsData.jobStats.statusDistribution]);

  const materialUsageData = useMemo(() => ({
    labels: analyticsData.materialStats.usageByCategory?.map(item => item.category) || [],
    datasets: [
      {
        label: 'Material Usage by Category',
        data: analyticsData.materialStats.usageByCategory?.map(item => item.quantity) || [],
        backgroundColor: 'var(--chart-purple)',
      },
    ],
  }), [analyticsData.materialStats.usageByCategory]);

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="error-state">{error}</div>;
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'var(--text-primary)'
        }
      },
      title: {
        display: true,
        color: 'var(--text-primary)'
      }
    },
    scales: {
      x: {
        grid: {
          color: 'var(--border-color)'
        },
        ticks: {
          color: 'var(--text-secondary)'
        }
      },
      y: {
        grid: {
          color: 'var(--border-color)'
        },
        ticks: {
          color: 'var(--text-secondary)'
        }
      }
    }
  };

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1>Business Analytics Dashboard</h1>
        <div className="refresh-section">
          {lastUpdated && (
            <span className="last-updated">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button 
            className="refresh-btn" 
            onClick={fetchAnalyticsData}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Revenue Overview</h3>
          <div className="stat-value">₹{(analyticsData.revenueStats?.totalRevenue || 0).toLocaleString()}</div>
          <div className="stat-label">Total Revenue</div>
          <div className={`growth ${(analyticsData.revenueStats?.monthlyGrowth || 0) >= 0 ? 'positive' : 'negative'}`}>
            {analyticsData.revenueStats?.monthlyGrowth || 0}% Monthly Growth
          </div>
        </div>

        <div className="stat-card">
          <h3>Job Statistics</h3>
          <div className="stat-value">{analyticsData.jobStats?.completedJobs || 0}</div>
          <div className="stat-label">Completed Jobs</div>
          <div className="total">
            Out of {analyticsData.jobStats?.totalJobs || 0} Total Jobs
          </div>
        </div>

        <div className="stat-card">
          <h3>Material Inventory</h3>
          <div className="stat-value">{analyticsData.materialStats?.lowStockItems || 0}</div>
          <div className="stat-label">Low Stock Items</div>
          <div className="total">
            Out of {analyticsData.materialStats?.totalItems || 0} Total Items
          </div>
        </div>

        <div className="stat-card">
          <h3>Workforce Overview</h3>
          <div className="stat-value">{analyticsData.electricianStats.activeElectricians}</div>
          <div className="stat-label">Active Electricians</div>
          <div className="total">
            Out of {analyticsData.electricianStats.totalElectricians} Total Electricians
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Revenue Trends</h3>
          <Line 
            data={revenueChartData} 
            options={{
              ...chartOptions,
              plugins: {
                ...chartOptions.plugins,
                title: {
                  ...chartOptions.plugins.title,
                  text: 'Monthly Revenue (Last 6 Months)'
                },
                filler: {
                  propagate: true
                }
              },
              elements: {
                line: {
                  tension: 0.4
                }
              }
            }} 
          />
        </div>

        <div className="chart-card">
          <h3>Job Status Distribution</h3>
          <ChartPie 
            data={jobStatusData} 
            options={{
              ...chartOptions,
              plugins: {
                ...chartOptions.plugins,
                legend: {
                  position: 'right',
                  labels: {
                    color: 'var(--text-primary)'
                  }
                }
              }
            }} 
          />
        </div>

        <div className="chart-card">
          <h3>Material Usage by Category</h3>
          <Bar 
            data={materialUsageData} 
            options={{
              ...chartOptions,
              plugins: {
                ...chartOptions.plugins,
                legend: {
                  display: false
                }
              }
            }} 
          />
        </div>
      </div>

      <div className="performance-section">
        <h3>Top Performing Electricians</h3>
        <div className="performers-list">
          {analyticsData.electricianStats.topPerformers.map((performer, index) => (
            <div key={index} className="performer-card">
              <div className="rank">#{index + 1}</div>
              <div className="name">{performer.name}</div>
              <div className="jobs">{performer.completedJobs} Jobs Completed</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics; 