// Blue chart colors
const chartColors = {
  primary: '#057dcd',      // Primary Blue
  secondary: '#43b0f1',    // Secondary Blue
  tertiary: '#6dc0f1',     // Accent Blue
  quaternary: '#96cff1',   // Muted Blue
  quinary: '#abd7f1',      // Light Blue
  background: '#e8eef1',   // Background
  border: '#1e3d58',       // Border Color
};

// Function to get chart colors
export const getChartColors = () => {
  return chartColors;
};

// Default chart configuration with blue colors
export const defaultChartOptions = () => {
  const colors = getChartColors();
  
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
            size: 12
          },
          color: '#1e3d58'
        }
      },      
      tooltip: {
        backgroundColor: '#e8eef1',
        titleColor: '#1e3d58',
        bodyColor: '#057dcd',
        borderColor: '#abd7f1',
        borderWidth: 1
      }
    },
    scales: {
      x: {        
        grid: {
          color: 'rgba(109, 192, 241, 0.3)'
        },
        ticks: {
          color: '#057dcd'
        }
      },
      y: {
        grid: {
          color: 'rgba(109, 192, 241, 0.3)'
        },
        ticks: {
          color: '#057dcd'
        }
      }
    }
  };
};

// Blue color palette for charts
export const colorPalette = [
  '#057dcd', // Primary Blue
  '#43b0f1', // Secondary Blue
  '#6dc0f1', // Accent Blue
  '#96cff1', // Light Blue
  '#abd7f1', // Lighter Blue
  '#bfdff1', // Very Light Blue
  '#e8eef1', // Ultra Light Blue
  '#1e3d58', // Dark Blue
  '#192f44', // Darker Blue
  '#132436', // Very Dark Blue
];

export default chartColors;