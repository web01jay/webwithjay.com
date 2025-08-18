import { useState, useEffect, useCallback } from 'react';

// Custom hook for managing API calls with loading and error states
const useApi = (apiFunction, dependencies = [], immediate = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiFunction(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, dependencies);

  return {
    data,
    loading,
    error,
    execute,
    setData,
    setError
  };
};

// Custom hook for managing form submissions
const useApiSubmit = (apiFunction) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const submit = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      const result = await apiFunction(...args);
      setSuccess(true);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction]);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setSuccess(false);
  }, []);

  return {
    loading,
    error,
    success,
    submit,
    reset
  };
};

// Custom hook for managing paginated data
const usePaginatedApi = (apiFunction, initialParams = {}) => {
  const [data, setData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [params, setParams] = useState({
    page: 0,
    limit: 10,
    ...initialParams
  });

  const fetchData = useCallback(async (newParams = {}) => {
    try {
      setLoading(true);
      setError(null);
      const mergedParams = { ...params, ...newParams };
      const result = await apiFunction(mergedParams);
      
      if (result.data) {
        setData(result.data);
        setTotalCount(result.totalCount || result.total || 0);
      } else {
        setData(result);
        setTotalCount(result.length);
      }
      
      setParams(mergedParams);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction, params]);

  const updateParams = useCallback((newParams) => {
    fetchData(newParams);
  }, [fetchData]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    totalCount,
    loading,
    error,
    params,
    updateParams,
    refresh,
    fetchData
  };
};

export { useApi, useApiSubmit, usePaginatedApi };