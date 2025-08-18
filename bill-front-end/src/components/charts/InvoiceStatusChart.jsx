import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { Box, Typography, Card, CardContent } from '@mui/material';

ChartJS.register(ArcElement, Tooltip, Legend);

const InvoiceStatusChart = ({ data, title = "Invoice Status Distribution" }) => {
  if (!data) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <Box display="flex" justifyContent="center" alignItems="center" height={300}>
            <Typography variant="body2" color="textSecondary">
              No data available
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const chartData = {
    labels: ['Paid', 'Sent', 'Draft', 'Overdue'],
    datasets: [
      {
        data: [data.paid, data.sent, data.draft, data.overdue],
        backgroundColor: [
          '#4caf50', // Green for paid
          '#2196f3', // Blue for sent
          '#ff9800', // Orange for draft
          '#f44336'  // Red for overdue
        ],
        borderColor: [
          '#4caf50',
          '#2196f3',
          '#ff9800',
          '#f44336'
        ],
        borderWidth: 2
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          }
        }
      }
    }
  };

  const total = Object.values(data).reduce((sum, value) => sum + value, 0);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Box height={300} display="flex" flexDirection="column" alignItems="center">
          <Box height={200} width="100%" display="flex" justifyContent="center">
            <Doughnut data={chartData} options={options} />
          </Box>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
            Total Invoices: {total}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default InvoiceStatusChart;