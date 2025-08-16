// Performance optimization utilities

// Debounce function for search inputs and other frequent operations
export const debounce = (func, wait, immediate) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
};

// Throttle function for scroll events and animations
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Intersection Observer for lazy loading
export const createIntersectionObserver = (callback, options = {}) => {
  const defaultOptions = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  };

  if (!window.IntersectionObserver) {
    // Fallback for browsers without IntersectionObserver
    callback([], { observe: () => {}, unobserve: () => {}, disconnect: () => {} });
    return;
  }

  const observer = new IntersectionObserver(callback, defaultOptions);
  return observer;
};

// Preload critical resources
export const preloadResource = (href, as = 'script', crossorigin = null) => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  if (crossorigin) link.crossOrigin = crossorigin;
  document.head.appendChild(link);
};

// Memory usage monitoring (development only)
export const monitorMemoryUsage = () => {
  if (process.env.NODE_ENV !== 'development' || !performance.memory) {
    return null;
  }

  const memory = performance.memory;
  return {
    usedJSHeapSize: (memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
    totalJSHeapSize: (memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
    jsHeapSizeLimit: (memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB'
  };
};

// Performance timing utilities
export const measurePerformance = (name, fn) => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`${name} took ${(end - start).toFixed(2)} milliseconds`);
  }
  
  return result;
};

// Optimize animations based on user preferences
export const getAnimationPreferences = () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return {
    prefersReducedMotion,
    animationDuration: prefersReducedMotion ? 0 : undefined,
    transition: prefersReducedMotion ? { duration: 0 } : undefined
  };
};

// Image optimization utilities
export const getOptimizedImageSrc = (src, width, height, quality = 80) => {
  // This would integrate with your image optimization service
  // For now, return the original src
  return src;
};

// Bundle size optimization - dynamic imports
export const loadComponentAsync = (importFn) => {
  return React.lazy(() => 
    importFn().catch(err => {
      console.error('Failed to load component:', err);
      // Return a fallback component
      return { default: () => React.createElement('div', null, 'Failed to load component') };
    })
  );
};

// Network status detection
export const getNetworkStatus = () => {
  if (!navigator.connection) {
    return { effectiveType: 'unknown', downlink: 'unknown' };
  }

  return {
    effectiveType: navigator.connection.effectiveType,
    downlink: navigator.connection.downlink,
    rtt: navigator.connection.rtt,
    saveData: navigator.connection.saveData
  };
};

// Optimize based on device capabilities
export const getDeviceCapabilities = () => {
  const hardwareConcurrency = navigator.hardwareConcurrency || 4;
  const deviceMemory = navigator.deviceMemory || 4;
  const network = getNetworkStatus();
  
  return {
    isLowEndDevice: hardwareConcurrency <= 2 || deviceMemory <= 2,
    isSlowNetwork: network.effectiveType === 'slow-2g' || network.effectiveType === '2g',
    shouldReduceAnimations: hardwareConcurrency <= 2 || network.saveData,
    maxConcurrentRequests: Math.min(hardwareConcurrency * 2, 8)
  };
};

// Virtual scrolling helper
export const calculateVisibleItems = (containerHeight, itemHeight, scrollTop, totalItems, buffer = 5) => {
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight),
    totalItems - 1
  );
  
  return {
    start: Math.max(0, visibleStart - buffer),
    end: Math.min(totalItems - 1, visibleEnd + buffer),
    visibleStart,
    visibleEnd
  };
};

// Error boundary helper
export const createErrorBoundary = (fallbackComponent) => {
  return class ErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
      return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
      console.error('Error caught by boundary:', error, errorInfo);
      // Log to error reporting service
    }

    render() {
      if (this.state.hasError) {
        return fallbackComponent || React.createElement('div', null, 'Something went wrong.');
      }

      return this.props.children;
    }
  };
};
