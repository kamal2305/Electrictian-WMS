import React from 'react';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
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
import { getChartColors, defaultChartOptions, colorPalette } from '../../chartColors';

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

/**
 * ElectroTrackChart - A component for rendering charts with GitHub styled theming
 * 
 * @param {string} type - The type of chart ('line', 'bar', 'pie', 'doughnut')
 * @param {Object} data - The data for the chart
 * @param {Object} options - Additional options for the chart
 * @param {string} title - The title of the chart
 * @param {number} height - The height of the chart (default: 300)
 * @returns {React.Component}
 */
const ElectroTrackChart = ({ type, data, options, title, height = 300 }) => {
  const chartColors = getChartColors();
  
  // Apply colors to data
  const themedData = {
    ...data,
    datasets: data.datasets.map((dataset, index) => {      // If dataset doesn't specify its own colors, use our color palette
      if (!dataset.backgroundColor) {
        const colorIndex = index % colorPalette.length;
        return {
          ...dataset,
          backgroundColor: type === 'line' 
            ? `${colorPalette[colorIndex]}30` // Add transparency for line fill
            : colorPalette[colorIndex],
          borderColor: colorPalette[colorIndex],
          hoverBackgroundColor: colorPalette[colorIndex],
          pointBackgroundColor: colorPalette[colorIndex],
          pointHoverBackgroundColor: colorPalette[colorIndex],
        };
      }
      return dataset;
    })
  };
  
  // Merge default options with passed options
  const chartOptions = {
    ...defaultChartOptions(),
    ...options,
    plugins: {
      ...defaultChartOptions(theme).plugins,
      ...(options?.plugins || {}),
      title: {
        ...defaultChartOptions(theme).plugins?.title,
        ...(options?.plugins?.title || {}),
        display: !!title,
        text: title,
        font: {
          size: 16,
          family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
        },
        color: theme === 'dark' ? '#ffffff' : '#24292e',
      }
    }
  };
  
  // Chart container style
  const containerStyle = {
    height: `${height}px`,
    maxWidth: '100%',
    marginBottom: '20px',
    background: theme === 'dark' ? chartColors.background : '#fff',
    borderRadius: '6px',
    padding: '15px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
    border: `1px solid ${chartColors.border}`,
  };
  
  // Render the appropriate chart based on type
  const renderChart = () => {
    switch (type.toLowerCase()) {
      case 'line':
        return <Line data={themedData} options={chartOptions} />;
      case 'bar':
        return <Bar data={themedData} options={chartOptions} />;
      case 'pie':
        return <Pie data={themedData} options={chartOptions} />;
      case 'doughnut':
        return <Doughnut data={themedData} options={chartOptions} />;
      default:
        return <div>Unsupported chart type: {type}</div>;
    }
  };
  
  return (
    <div className="electro-track-chart" style={containerStyle}>
      {renderChart()}
    </div>
  );
};

export default ElectroTrackChart;