import React, { useState, useMemo, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  Box,
  Typography,
  Skeleton,
  Chip
} from '@mui/material';

const DataTable = ({
  columns,
  data,
  title,
  onSort,
  onPageChange,
  onRowsPerPageChange,
  onRowClick,
  page = 0,
  rowsPerPage = 10,
  totalCount = 0,
  loading = false,
  sortBy = '',
  sortOrder = 'asc',
  dense = false,
  stickyHeader = false,
  showRowNumbers = false,
  emptyMessage = 'No data available',
  loadingRows = 5
}) => {
  const [orderBy, setOrderBy] = useState(sortBy);
  const [order, setOrder] = useState(sortOrder);

  const handleRequestSort = useCallback((property) => {
    const isAsc = orderBy === property && order === 'asc';
    const newOrder = isAsc ? 'desc' : 'asc';
    setOrder(newOrder);
    setOrderBy(property);
    if (onSort) {
      onSort(property, newOrder);
    }
  }, [orderBy, order, onSort]);

  const handleChangePage = useCallback((event, newPage) => {
    if (onPageChange) {
      onPageChange(newPage);
    }
  }, [onPageChange]);

  const handleChangeRowsPerPage = useCallback((event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    if (onRowsPerPageChange) {
      onRowsPerPageChange(newRowsPerPage);
    }
  }, [onRowsPerPageChange]);

  const handleRowClick = useCallback((row) => {
    if (onRowClick) {
      onRowClick(row);
    }
  }, [onRowClick]);

  // Memoize columns to prevent unnecessary re-renders
  const memoizedColumns = useMemo(() => columns, [columns]);

  // Create skeleton rows for loading state
  const skeletonRows = useMemo(() => {
    return Array.from({ length: loadingRows }, (_, index) => (
      <TableRow key={`skeleton-${index}`}>
        {showRowNumbers && (
          <TableCell>
            <Skeleton variant="text" width={30} />
          </TableCell>
        )}
        {memoizedColumns.map((column) => (
          <TableCell key={column.id} align={column.align || 'left'}>
            <Skeleton 
              variant="text" 
              width={column.skeletonWidth || '80%'} 
              height={20}
            />
          </TableCell>
        ))}
      </TableRow>
    ));
  }, [loadingRows, memoizedColumns, showRowNumbers]);

  // Memoize table rows to prevent unnecessary re-renders
  const tableRows = useMemo(() => {
    if (loading) {
      return skeletonRows;
    }

    if (data.length === 0) {
      return (
        <TableRow>
          <TableCell 
            colSpan={memoizedColumns.length + (showRowNumbers ? 1 : 0)} 
            align="center"
            sx={{ py: 4 }}
          >
            <Typography variant="body2" color="textSecondary">
              {emptyMessage}
            </Typography>
          </TableCell>
        </TableRow>
      );
    }

    return data.map((row, index) => (
      <TableRow 
        key={row.id || row._id || index} 
        hover={!!onRowClick}
        onClick={() => handleRowClick(row)}
        sx={{ 
          cursor: onRowClick ? 'pointer' : 'default',
          '&:hover': onRowClick ? { backgroundColor: 'action.hover' } : {}
        }}
      >
        {showRowNumbers && (
          <TableCell sx={{ width: 60 }}>
            <Chip 
              label={page * rowsPerPage + index + 1} 
              size="small" 
              variant="outlined"
            />
          </TableCell>
        )}
        {memoizedColumns.map((column) => (
          <TableCell 
            key={column.id} 
            align={column.align || 'left'}
            sx={{
              maxWidth: column.maxWidth || 'none',
              overflow: column.truncate ? 'hidden' : 'visible',
              textOverflow: column.truncate ? 'ellipsis' : 'clip',
              whiteSpace: column.truncate ? 'nowrap' : 'normal'
            }}
          >
            {column.render ? column.render(row[column.id], row, index) : row[column.id]}
          </TableCell>
        ))}
      </TableRow>
    ));
  }, [data, loading, memoizedColumns, showRowNumbers, page, rowsPerPage, onRowClick, handleRowClick, skeletonRows, emptyMessage]);

  return (
    <Paper sx={{ width: '100%', mb: 2 }}>
      {title && (
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
          {totalCount > 0 && (
            <Typography variant="body2" color="textSecondary">
              {totalCount.toLocaleString()} total items
            </Typography>
          )}
        </Box>
      )}
      <TableContainer sx={{ maxHeight: stickyHeader ? 440 : 'none' }}>
        <Table 
          sx={{ minWidth: 750 }} 
          size={dense ? 'small' : 'medium'}
          stickyHeader={stickyHeader}
        >
          <TableHead>
            <TableRow>
              {showRowNumbers && (
                <TableCell sx={{ width: 60 }}>
                  #
                </TableCell>
              )}
              {memoizedColumns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || 'left'}
                  sortDirection={orderBy === column.id ? order : false}
                  sx={{ 
                    fontWeight: 'bold',
                    backgroundColor: stickyHeader ? 'background.paper' : 'transparent',
                    minWidth: column.minWidth || 'auto',
                    width: column.width || 'auto'
                  }}
                >
                  {column.sortable !== false ? (
                    <TableSortLabel
                      active={orderBy === column.id}
                      direction={orderBy === column.id ? order : 'asc'}
                      onClick={() => handleRequestSort(column.id)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {tableRows}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50, 100]}
        component="div"
        count={totalCount}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        showFirstButton
        showLastButton
        labelDisplayedRows={({ from, to, count }) => 
          `${from}-${to} of ${count !== -1 ? count.toLocaleString() : `more than ${to}`}`
        }
      />
    </Paper>
  );
};

export default DataTable;