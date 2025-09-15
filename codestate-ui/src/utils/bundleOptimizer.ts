// Bundle optimization utilities
// This file contains utilities to help with tree shaking and bundle optimization

/**
 * Creates a conditional import function for optional dependencies
 * This helps with tree shaking by only importing when needed
 */
export function createConditionalImport<T>(
  importFn: () => Promise<T>,
  fallback?: T
) {
  return async (): Promise<T | undefined> => {
    try {
      return await importFn();
    } catch (error) {
      console.warn('Conditional import failed:', error);
      return fallback;
    }
  };
}

/**
 * Lazy loads a component with error boundary
 */
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallbackComponent?: T
) {
  return React.lazy(async () => {
    try {
      return await importFn();
    } catch (error) {
      console.error('Failed to load component:', error);
      if (fallbackComponent) {
        return { default: fallbackComponent };
      }
      throw error;
    }
  });
}

/**
 * Optimized import for Preact hooks
 * Only imports what's needed
 */
export const preactHooks = {
  useState: () => import('preact/hooks').then(m => m.useState),
  useEffect: () => import('preact/hooks').then(m => m.useEffect),
  useMemo: () => import('preact/hooks').then(m => m.useMemo),
  useCallback: () => import('preact/hooks').then(m => m.useCallback),
  useRef: () => import('preact/hooks').then(m => m.useRef),
};

/**
 * Optimized import for Preact compat
 * Only imports what's needed
 */
export const preactCompat = {
  memo: () => import('preact/compat').then(m => m.memo),
  lazy: () => import('preact/compat').then(m => m.lazy),
  Suspense: () => import('preact/compat').then(m => m.Suspense),
  createContext: () => import('preact/compat').then(m => m.createContext),
  useContext: () => import('preact/compat').then(m => m.useContext),
};

/**
 * Bundle size analyzer helper
 * Logs bundle information in development
 */
export function analyzeBundleSize() {
  if (process.env.NODE_ENV === 'development') {
    // Log bundle information
    console.group('📦 Bundle Analysis');
    console.log('Components loaded:', document.querySelectorAll('[data-component]').length);
    console.log('CSS rules loaded:', document.styleSheets.length);
    console.log('DOM elements:', document.querySelectorAll('*').length);
    console.groupEnd();
  }
}

/**
 * Preload critical resources
 * Helps with perceived performance
 */
export function preloadCriticalResources() {
  // Preload critical CSS
  const criticalCSS = [
    './styles/design-system.css',
    './app.css'
  ];

  criticalCSS.forEach(cssPath => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = cssPath;
    document.head.appendChild(link);
  });
}

/**
 * Clean up unused resources
 * Helps with memory management
 */
export function cleanupUnusedResources() {
  // Remove unused style elements
  const styleElements = document.querySelectorAll('style[data-unused="true"]');
  styleElements.forEach(el => el.remove());

  // Clear unused event listeners
  // This would need to be implemented per component
  console.log('Cleanup completed');
}

// Import React for the lazy component function
import React from 'preact/compat';