import { registerRootComponent } from 'expo';
import ErrorBoundary from './ErrorBoundary';

// Suppress specific development warnings
if (__DEV__) {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    // Suppress React DevTools warning
    if (args[0] && args[0].includes && args[0].includes('React DevTools')) {
      return;
    }
    // Suppress development-level warnings
    if (args[0] && args[0].includes && args[0].includes('Development-level warnings')) {
      return;
    }
    // Suppress Object warnings from React Native Web
    if (args[0] === 'Object') {
      return;
    }
    // Suppress performance warnings
    if (args[0] && args[0].includes && args[0].includes('Performance optimizations')) {
      return;
    }
    originalWarn.apply(console, args);
  };
}

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(() => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
));