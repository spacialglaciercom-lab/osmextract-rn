// Error recovery and debugging utilities

export function createSafeCallback(callback, name = 'unknown') {
  return (...args) => {
    try {
      return callback(...args);
    } catch (error) {
      console.error(`Error in ${name} callback:`, error);
      console.error('Arguments:', args);
      
      // Return safe default values based on callback type
      if (callback.name.includes('set') || name.includes('set')) {
        return undefined; // For state setters
      }
      return null;
    }
  };
}

export function safeConsoleLog(label, data, maxDepth = 2) {
  try {
    if (typeof data === 'function') {
      console.log(`${label}: [Function ${data.name || 'anonymous'}]`);
      return;
    }
    
    if (typeof data === 'object' && data !== null) {
      // Check for circular references
      const seen = new WeakSet();
      const safeData = JSON.parse(JSON.stringify(data, (key, value) => {
        if (typeof value === 'function') {
          return '[Function]';
        }
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular]';
          }
          seen.add(value);
        }
        return value;
      }));
      
      console.log(`${label}:`, safeData);
    } else {
      console.log(`${label}:`, data);
    }
  } catch (error) {
    console.log(`${label}: [Error logging data: ${error.message}]`);
  }
}

export function wrapFunction(fn, name = 'anonymous') {
  return (...args) => {
    console.log(`Calling ${name} with args:`, args.length > 0 ? args : 'no args');
    try {
      const result = fn(...args);
      console.log(`${name} completed successfully`);
      return result;
    } catch (error) {
      console.error(`Error in ${name}:`, error);
      throw error;
    }
  };
}

// Memory usage monitoring
export function logMemoryUsage(context = '') {
  if (typeof performance !== 'undefined' && performance.memory) {
    const memory = performance.memory;
    console.log(`Memory usage ${context}:`, {
      used: `${Math.round(memory.usedJSHeapSize / 1048576)}MB`,
      total: `${Math.round(memory.totalJSHeapSize / 1048576)}MB`,
      limit: `${Math.round(memory.jsHeapSizeLimit / 1048576)}MB`,
    });
  }
}