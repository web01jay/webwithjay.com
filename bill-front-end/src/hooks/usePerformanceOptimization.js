import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook for monitoring and optimizing performance of route transitions
 */
export const useRoutePerformance = () => {
  const location = useLocation();
  const routeStartTime = useRef(null);
  const performanceData = useRef({});

  useEffect(() => {
    // Mark route transition start
    routeStartTime.current = performance.now();
    
    // Mark route transition complete when DOM is ready
    const markComplete = () => {
      if (routeStartTime.current) {
        const duration = performance.now() - routeStartTime.current;
        performanceData.current[location.pathname] = {
          duration,
          timestamp: Date.now()
        };
        
        // Log performance data in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`Route transition to ${location.pathname}: ${duration.toFixed(2)}ms`);
        }
      }
    };

    // Use requestAnimationFrame to ensure DOM is painted
    const rafId = requestAnimationFrame(markComplete);
    
    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [location.pathname]);

  const getPerformanceData = useCallback(() => {
    return { ...performanceData.current };
  }, []);

  return { getPerformanceData };
};

/**
 * Hook for optimizing component re-renders
 */
export const useRenderOptimization = (componentName) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current += 1;
    const currentTime = performance.now();
    const timeSinceLastRender = currentTime - lastRenderTime.current;
    lastRenderTime.current = currentTime;

    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} render #${renderCount.current} (${timeSinceLastRender.toFixed(2)}ms since last)`);
    }
  });

  return {
    renderCount: renderCount.current
  };
};

/**
 * Hook for lazy loading optimization
 */
export const useLazyLoadOptimization = () => {
  const preloadedComponents = useRef(new Set());

  const preloadComponent = useCallback((importFunction, componentName) => {
    if (!preloadedComponents.current.has(componentName)) {
      preloadedComponents.current.add(componentName);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Preloading component: ${componentName}`);
      }
      
      return importFunction();
    }
  }, []);

  const isPreloaded = useCallback((componentName) => {
    return preloadedComponents.current.has(componentName);
  }, []);

  return {
    preloadComponent,
    isPreloaded
  };
};

/**
 * Hook for bundle size optimization tracking
 */
export const useBundleOptimization = () => {
  const loadedChunks = useRef(new Set());

  const trackChunkLoad = useCallback((chunkName) => {
    if (!loadedChunks.current.has(chunkName)) {
      loadedChunks.current.add(chunkName);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Loaded chunk: ${chunkName}`);
        console.log(`Total chunks loaded: ${loadedChunks.current.size}`);
      }
    }
  }, []);

  const getLoadedChunks = useCallback(() => {
    return Array.from(loadedChunks.current);
  }, []);

  return {
    trackChunkLoad,
    getLoadedChunks
  };
};

export default {
  useRoutePerformance,
  useRenderOptimization,
  useLazyLoadOptimization,
  useBundleOptimization
};