// Debug information utility
export function getSystemInfo() {
  return {
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
    platform: typeof navigator !== 'undefined' ? navigator.platform : 'Unknown',
    memory: typeof performance !== 'undefined' && performance.memory ? {
      used: Math.round(performance.memory.usedJSHeapSize / 1048576), // MB
      total: Math.round(performance.memory.totalJSHeapSize / 1048576), // MB
      limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576), // MB
    } : null,
    timestamp: new Date().toISOString(),
  };
}

export function logErrorDetails(error, context = '') {
  console.error('=== ERROR DETAILS ===');
  console.error('Context:', context);
  console.error('Error:', error);
  console.error('Message:', error.message);
  console.error('Stack:', error.stack);
  console.error('System Info:', getSystemInfo());
  console.error('====================');
}

export function safeStringify(obj, maxDepth = 3) {
  try {
    const seen = new WeakSet();
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }
      return value;
    }, 2, maxDepth);
  } catch (error) {
    return `[Stringify Error: ${error.message}]`;
  }
}