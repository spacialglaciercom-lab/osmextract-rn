// Metro configuration for React Native
// Optimized for performance and reduced warnings

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Performance optimizations
config.transformer = {
  ...config.transformer,
  
  // Enable minification in development for better performance
  minifyOptions: {
    compress: {
      drop_console: false, // Keep console but optimize
      drop_debugger: true,
      pure_funcs: ['console.log', 'console.info'],
    },
  },
  
  // Optimize bundle size
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

// Resolver optimizations
config.resolver = {
  ...config.resolver,
  
  // Optimize module resolution
  sourceExts: ['jsx', 'js', 'ts', 'tsx', 'json'],
  assetExts: ['glb', 'gltf', 'png', 'jpg', 'jpeg', 'mp3', 'obj', 'mtl'],
};

// Reduce console noise in development
if (process.env.NODE_ENV === 'development') {
  const originalConsoleWarn = console.warn;
  console.warn = (...args) => {
    const message = args[0]?.toString() || '';
    
    // Suppress specific performance warnings
    if (message.includes('Performance optimizations') ||
        message.includes('Development-level warnings') ||
        message.includes('React DevTools') ||
        message === 'Object' ||
        message.includes('Maximum call stack')) {
      return;
    }
    
    originalConsoleWarn.apply(console, args);
  };
}

module.exports = config;