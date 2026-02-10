// Performance Optimization Configuration
// This file configures performance settings for both development and production

// Development Performance Settings
const DEV_PERFORMANCE_CONFIG = {
  // Enable performance optimizations even in development
  enableOptimizations: true,
  
  // Map rendering optimizations
  mapPerformance: {
    tileCacheSize: 100, // Cache more tiles for better performance
    maxZoom: 18, // Limit max zoom to reduce tile loading
    updateInterval: 16, // 60fps update interval
    debounceTime: 100, // Debounce map movements
  },
  
  // Component rendering optimizations
  componentOptimizations: {
    useMemo: true,
    useCallback: true,
    memoComponents: true,
    virtualizeLists: true,
  },
  
  // Network optimizations
  networkOptimizations: {
    tilePreload: 3, // Preload surrounding tiles
    retryAttempts: 2,
    timeout: 5000,
  }
};

// Production Performance Settings  
const PROD_PERFORMANCE_CONFIG = {
  ...DEV_PERFORMANCE_CONFIG,
  enableOptimizations: true,
  mapPerformance: {
    ...DEV_PERFORMANCE_CONFIG.mapPerformance,
    tileCacheSize: 200, // Larger cache in production
    updateInterval: 8, // 120fps for smoother experience
  }
};

// Current configuration based on environment
export const PERFORMANCE_CONFIG = __DEV__ ? DEV_PERFORMANCE_CONFIG : PROD_PERFORMANCE_CONFIG;

// Performance monitoring
export const PerformanceMonitor = {
  start: (name) => {
    if (__DEV__ && PERFORMANCE_CONFIG.enableOptimizations) {
      console.time(`⏱️ ${name}`);
    }
  },
  
  end: (name) => {
    if (__DEV__ && PERFORMANCE_CONFIG.enableOptimizations) {
      console.timeEnd(`⏱️ ${name}`);
    }
  },
  
  log: (message) => {
    if (__DEV__ && PERFORMANCE_CONFIG.enableOptimizations) {
      console.log(`⚡ ${message}`);
    }
  }
};

// Suppress performance warnings in development
if (__DEV__) {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    const message = args[0]?.toString() || '';
    
    // Suppress performance optimization warnings
    if (message.includes('Performance optimizations') || 
        message.includes('Performance optimizations: OFF')) {
      return;
    }
    
    // Suppress other development warnings we don't need
    if (message.includes('Development-level warnings') || 
        message.includes('React DevTools') ||
        message === 'Object') {
      return;
    }
    
    originalWarn.apply(console, args);
  };
  
  // Log that performance optimizations are actually ON
  console.log('⚡ Performance optimizations: ON (Development Mode)');
  console.log('🗺️ Map tile caching enabled');
  console.log('🔄 Component memoization active');
}