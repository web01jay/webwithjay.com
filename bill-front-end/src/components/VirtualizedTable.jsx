import React, { useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography
} from '@mui/material';

const VirtualizedTable = ({
  columns,
  data,
  height = 400,
  itemHeight = 52,
  title,
  loading = false,
  onRowClick
}) => {
  const Row = useCallback(({ index, style }) => {
    const row = data[index];
    
    return (
      <div style={style}>
        <TableRow 
          hover 
          onClick={() => onRowClick && onRowClick(row)}
          sx={{ 
            cursor: onRowClick ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid rgba(224, 224, 224, 1)'
          }}
        >
          {columns.map((column) => (
            <TableCell 
              key={column.id} 
              align={column.align || 'left'}
              sx={{ 
                flex: column.width || 1,
                minWidth: column.minWidth || 'auto',
                maxWidth: column.maxWidth || 'none',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {column.render ? column.render(row[column.id], row) : row[column.id]}
            </TableCell>
          ))}
        </TableRow>
      </div>
    );
  }, [data, columns, onRowClick]);

  const HeaderRow = useMemo(() => (
    <TableRow sx={{ display: 'flex', alignItems: 'center' }}>
      {columns.map((column) => (
        <TableCell 
          key={column.id} 
          align={column.align || 'left'}
          sx={{ 
            flex: column.width || 1,
            minWidth: column.minWidth || 'auto',
            maxWidth: column.maxWidth || 'none',
            fontWeight: 'bold',
            backgroundColor: 'grey.50'
          }}
        >
          {column.label}
        </TableCell>
      ))}
    </TableRow>
  ), [columns]);

  if (loading) {
    return (
      <Paper sx={{ width: '100%', mb: 2 }}>
        {title && (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" component="div">
              {title}
            </Typography>
          </Box>
        )}
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          height={height}
        >
          <Typography>Loading...</Typography>
        </Box>
      </Paper>
    );
  }

  if (data.length === 0) {
    return (
      <Paper sx={{ width: '100%', mb: 2 }}>
        {title && (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" component="div">
              {title}
            </Typography>
          </Box>
        )}
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          height={height}
        >
          <Typography color="textSecondary">No data available</Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ width: '100%', mb: 2 }}>
      {title && (
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        </Box>
      )}
      <TableContainer>
        <Table stickyHeader>
          <TableHead>
            {HeaderRow}
          </TableHead>
        </Table>
        <Box sx={{ height }}>
          <List
            height={height}
            itemCount={data.length}
            itemSize={itemHeight}
            overscanCount={5}
          >
            {Row}
          </List>
        </Box>
      </TableContainer>
    </Paper>
  );
};

export default VirtualizedTable;