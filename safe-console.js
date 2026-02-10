// Safe console wrapper to prevent any console-related stack overflow issues

const originalConsole = { ...console };

// Track console calls to prevent infinite recursion
let consoleCallDepth = 0;
const MAX_CONSOLE_DEPTH = 10;

function safeConsoleCall(level, ...args) {
  if (consoleCallDepth > MAX_CONSOLE_DEPTH) {
    originalConsole.warn('[SafeConsole] Prevented potential infinite recursion');
    return;
  }
  
  consoleCallDepth++;
  
  try {
    // Sanitize arguments to prevent circular references
    const sanitizedArgs = args.map(arg => {
      if (typeof arg === 'function') {
        return `[Function ${arg.name || 'anonymous'}]`;
      }
      
      if (typeof arg === 'object' && arg !== null) {
        try {
          // Try to stringify safely
          return JSON.parse(JSON.stringify(arg, (key, value) => {
            if (typeof value === 'function') return '[Function]';
            if (value instanceof Error) return `[Error: ${value.message}]`;
            if (typeof value === 'object' && value !== null) {
              // Prevent deep nesting
              if (key && key.length > 50) return '[Deep Key]';
            }
            return value;
          }));
        } catch (e) {
          return `[Object with circular reference]`;
        }
      }
      
      return arg;
    });
    
    originalConsole[level](...sanitizedArgs);
  } catch (error) {
    originalConsole.error('[SafeConsole] Error during logging:', error.message);
  } finally {
    consoleCallDepth--;
  }
}

// Create safe console methods
export const safeConsole = {
  log: (...args) => safeConsoleCall('log', ...args),
  warn: (...args) => safeConsoleCall('warn', ...args),
  error: (...args) => safeConsoleCall('error', ...args),
  info: (...args) => safeConsoleCall('info', ...args),
  debug: (...args) => safeConsoleCall('debug', ...args),
  
  // Special method for critical errors that should always be shown
  critical: (...args) => {
    try {
      originalConsole.error('[CRITICAL]', ...args);
    } catch (e) {
      // Even if safe console fails, try to show critical errors
      console.error('[CRITICAL - SafeConsole failed]', e);
    }
  }
};

// Replace global console in development
if (process.env.NODE_ENV === 'development') {
  console.log = safeConsole.log;
  console.warn = safeConsole.warn;
  console.error = safeConsole.error;
  console.info = safeConsole.info;
  console.debug = safeConsole.debug;
  
  console.log('SafeConsole initialized - protected against circular references');
}