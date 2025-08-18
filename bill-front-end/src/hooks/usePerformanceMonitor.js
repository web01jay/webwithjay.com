import { useEffect, useRef, useCallback } from 'react';

const usePerformanceMonitor = (componentName) => {
  const renderStartTime = useRef(null);
  const renderCount = useRef(0);
  const mountTime = useRef(null);

  useEffect(() => {
    mountTime.current = performance.now();
    
    return () => {
      if (process.env.NODE_ENV === 'development') {
        const unmountTime = performance.now();
        const totalLifetime = unmountTime - mountTime.current;
        console.log(`[Performance] ${componentName} lifetime: ${totalLifetime.toFixed(2)}ms, renders: ${renderCount.current}`);
      }
    };
  }, [componentName]);

  const startRender = useCallback(() => {
    renderStartTime.current = performance.now();
    renderCount.current += 1;
  }, []);

  const endRender = useCallback(() => {
    if (renderStartTime.current && process.env.NODE_ENV === 'development') {
      const renderTime = performance.now() - renderStartTime.current;
      if (renderTime > 16) { // Log slow renders (>16ms)
        console.warn(`[Performance] ${componentName} slow render: ${renderTime.toFixed(2)}ms (render #${renderCount.current})`);
      }
    }
  }, [componentName]);

  const measureAsync = useCallback(async (operation, operationName) => {
    const start = performance.now();
    try {
      const result = await operation();
      const end = performance.now();
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${componentName} - ${operationName}: ${(end - start).toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const end = performance.now();
      if (process.env.NODE_ENV === 'development') {
        console.error(`[Performance] ${componentName} - ${operationName} failed after ${(end - start).toFixed(2)}ms:`, error);
      }
      throw error;
    }
  }, [componentName]);

  const measureSync = useCallback((operation, operationName) => {
    const start = performance.now();
    try {
      const result = operation();
      const end = performance.now();
      
      if (process.env.NODE_ENV === 'development') {
        const duration = end - start;
        if (duration > 5) { // Log operations taking more than 5ms
          console.log(`[Performance] ${componentName} - ${operationName}: ${duration.toFixed(2)}ms`);
        }
      }
      
      return result;
    } catch (error) {
      const end = performance.now();
      if (process.env.NODE_ENV === 'development') {
        console.error(`[Performance] ${componentName} - ${operationName} failed after ${(end - start).toFixed(2)}ms:`, error);
      }
      throw error;
    }
  }, [componentName]);

  // Auto-track renders
  useEffect(() => {
    startRender();
    endRender();
  });

  return {
    startRender,
    endRender,
    measureAsync,
    measureSync,
    getRenderCount: () => renderCount.current
  };
};

export default usePerformanceMonitor;