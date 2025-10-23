import { formatCurrency } from './formatters';

// Base chart configuration
export const getBaseChartConfig = () => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom',
      labels: {
        padding: 15,
        usePointStyle: true,
        font: { size: 12, weight: '500' },
        color: '#374151'
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      titleFont: { size: 13, weight: 'bold' },
      bodyFont: { size: 12 },
      displayColors: true,
      callbacks: {
        label: function(context) {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          if (context.parsed.y !== null) {
            label += formatCurrency(context.parsed.y, 'LKR');
          }
          return label;
        }
      }
    }
  }
});

// Line chart configuration
export const getLineChartOptions = () => ({
  ...getBaseChartConfig(),
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#6b7280', font: { size: 11 } }
    },
    y: {
      grid: { color: 'rgba(0,0,0,0.05)' },
      ticks: {
        color: '#6b7280',
        font: { size: 11 },
        callback: function(value) {
          return formatCurrency(value, 'LKR').replace('LKR ', 'LKR ');
        }
      }
    }
  },
  interaction: {
    intersect: false,
    mode: 'index'
  }
});

// Bar chart configuration
export const getBarChartOptions = () => ({
  ...getBaseChartConfig(),
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#6b7280', font: { size: 11 } }
    },
    y: {
      grid: { color: 'rgba(0,0,0,0.1)' },
      ticks: {
        color: '#6b7280',
        font: { size: 11 },
        callback: function(value) {
          return formatCurrency(value, 'LKR').replace('LKR ', 'LKR ');
        }
      }
    }
  }
});

// Pie/Doughnut chart configuration
export const getPieChartOptions = () => ({
  ...getBaseChartConfig(),
  plugins: {
    ...getBaseChartConfig().plugins,
    tooltip: {
      ...getBaseChartConfig().plugins.tooltip,
      callbacks: {
        label: function(context) {
          const label = context.label || '';
          const value = context.parsed || 0;
          const total = context.dataset.data.reduce((a, b) => a + b, 0);
          const percentage = ((value / total) * 100).toFixed(1);
          return `${label}: ${formatCurrency(value, 'LKR')} (${percentage}%)`;
        }
      }
    }
  }
});

// Multi-axis bar chart configuration
export const getMultiAxisBarChartOptions = () => ({
  ...getBaseChartConfig(),
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#6b7280', font: { size: 11 } }
    },
    y: {
      type: 'linear',
      display: true,
      position: 'left',
      grid: { color: 'rgba(0,0,0,0.1)' },
      ticks: {
        color: '#6b7280',
        font: { size: 11 },
        callback: function(value) {
          return formatCurrency(value, 'LKR').replace('LKR ', 'LKR ');
        }
      }
    },
    y1: {
      type: 'linear',
      display: true,
      position: 'right',
      grid: { drawOnChartArea: false },
      ticks: {
        color: '#6b7280',
        font: { size: 11 },
        callback: function(value) {
          return value.toLocaleString();
        }
      }
    }
  }
});

// Get chart options by type
export const getChartOptions = (type) => {
  switch (type) {
    case 'line':
      return getLineChartOptions();
    case 'bar':
      return getBarChartOptions();
    case 'pie':
    case 'doughnut':
      return getPieChartOptions();
    case 'multiAxis':
      return getMultiAxisBarChartOptions();
    default:
      return getBaseChartConfig();
  }
};

// Color palettes
export const colorPalettes = {
  primary: [
    'rgba(16, 185, 129, 0.8)',   // Emerald
    'rgba(59, 130, 246, 0.8)',   // Blue
    'rgba(251, 146, 60, 0.8)',   // Orange
    'rgba(139, 92, 246, 0.8)',   // Purple
    'rgba(236, 72, 153, 0.8)',   // Pink
    'rgba(245, 158, 11, 0.8)',   // Amber
  ],
  borders: [
    'rgb(16, 185, 129)',
    'rgb(59, 130, 246)',
    'rgb(251, 146, 60)',
    'rgb(139, 92, 246)',
    'rgb(236, 72, 153)',
    'rgb(245, 158, 11)',
  ],
  gradients: {
    emerald: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    blue: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    orange: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
    purple: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
  }
};

// Generate chart data
export const generateChartData = (labels, datasets) => {
  return {
    labels,
    datasets: datasets.map((dataset, index) => ({
      ...dataset,
      backgroundColor: dataset.backgroundColor || colorPalettes.primary[index % colorPalettes.primary.length],
      borderColor: dataset.borderColor || colorPalettes.borders[index % colorPalettes.borders.length],
      borderWidth: dataset.borderWidth || 2,
      tension: dataset.tension || 0.4,
    }))
  };
};

// Time period options for charts
export const chartPeriods = {
  '1month': { label: '1 Month', days: 30 },
  '3months': { label: '3 Months', days: 90 },
  '6months': { label: '6 Months', days: 180 },
  '1year': { label: '1 Year', days: 365 },
  'ytd': { label: 'Year to Date', days: null },
  'all': { label: 'All Time', days: null },
};

// Export chart data to CSV
export const exportChartToCSV = (chartData, filename = 'chart-data.csv') => {
  const { labels, datasets } = chartData;
  
  // Create header row
  const headers = ['Label', ...datasets.map(d => d.label)];
  
  // Create data rows
  const rows = labels.map((label, index) => {
    return [label, ...datasets.map(d => d.data[index] || 0)];
  });
  
  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};
