import { useState, useCallback, useMemo } from 'react';

const usePagination = ({
  initialPage = 0,
  initialRowsPerPage = 10,
  totalCount = 0,
  onPageChange,
  onRowsPerPageChange
}) => {
  const [page, setPage] = useState(initialPage);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);

  const totalPages = useMemo(() => {
    return Math.ceil(totalCount / rowsPerPage);
  }, [totalCount, rowsPerPage]);

  const hasNextPage = useMemo(() => {
    return page < totalPages - 1;
  }, [page, totalPages]);

  const hasPrevPage = useMemo(() => {
    return page > 0;
  }, [page]);

  const startIndex = useMemo(() => {
    return page * rowsPerPage;
  }, [page, rowsPerPage]);

  const endIndex = useMemo(() => {
    return Math.min(startIndex + rowsPerPage, totalCount);
  }, [startIndex, rowsPerPage, totalCount]);

  const handlePageChange = useCallback((newPage) => {
    const clampedPage = Math.max(0, Math.min(newPage, totalPages - 1));
    setPage(clampedPage);
    if (onPageChange) {
      onPageChange(clampedPage);
    }
  }, [totalPages, onPageChange]);

  const handleRowsPerPageChange = useCallback((newRowsPerPage) => {
    const newTotalPages = Math.ceil(totalCount / newRowsPerPage);
    const newPage = Math.min(page, newTotalPages - 1);
    
    setRowsPerPage(newRowsPerPage);
    setPage(Math.max(0, newPage));
    
    if (onRowsPerPageChange) {
      onRowsPerPageChange(newRowsPerPage);
    }
    if (onPageChange && newPage !== page) {
      onPageChange(Math.max(0, newPage));
    }
  }, [page, totalCount, onPageChange, onRowsPerPageChange]);

  const goToFirstPage = useCallback(() => {
    handlePageChange(0);
  }, [handlePageChange]);

  const goToLastPage = useCallback(() => {
    handlePageChange(totalPages - 1);
  }, [handlePageChange, totalPages]);

  const goToNextPage = useCallback(() => {
    if (hasNextPage) {
      handlePageChange(page + 1);
    }
  }, [hasNextPage, handlePageChange, page]);

  const goToPrevPage = useCallback(() => {
    if (hasPrevPage) {
      handlePageChange(page - 1);
    }
  }, [hasPrevPage, handlePageChange, page]);

  const reset = useCallback(() => {
    setPage(initialPage);
    setRowsPerPage(initialRowsPerPage);
  }, [initialPage, initialRowsPerPage]);

  const paginationInfo = useMemo(() => ({
    page,
    rowsPerPage,
    totalPages,
    totalCount,
    hasNextPage,
    hasPrevPage,
    startIndex,
    endIndex,
    displayText: totalCount > 0 
      ? `${startIndex + 1}-${endIndex} of ${totalCount.toLocaleString()}`
      : 'No items'
  }), [
    page,
    rowsPerPage,
    totalPages,
    totalCount,
    hasNextPage,
    hasPrevPage,
    startIndex,
    endIndex
  ]);

  return {
    ...paginationInfo,
    handlePageChange,
    handleRowsPerPageChange,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPrevPage,
    reset
  };
};

export default usePagination;