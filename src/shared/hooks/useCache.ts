import { useCacheStore } from '../stores/cacheStore';
import { DataCacheService } from '../../infrastructure/services/DataCacheService';

/**
 * Custom hook for accessing cache data and actions
 * This provides a clean interface for components to interact with the cache
 */
export const useCache = () => {
  const store = useCacheStore();
  const dataCacheService = DataCacheService.getInstance();

  return {
    // Data
    sessions: store.sessions,
    scripts: store.scripts,
    config: store.config,
    
    // Loading states
    loading: store.loading,
    isLoading: (key: keyof typeof store.loading) => store.loading[key],
    
    // Error states
    errors: store.errors,
    getError: (key: keyof typeof store.errors) => store.errors[key],
    
    // Cache metadata
    lastUpdated: store.lastUpdated,
    isStale: (key: keyof typeof store.lastUpdated, ttlMs?: number) => store.isStale(key, ttlMs),
    hasData: (key: 'sessions' | 'scripts' | 'config') => store.hasData(key),
    
    // Actions
    refreshSessions: () => dataCacheService.getSessions(true),
    refreshScripts: () => dataCacheService.getScripts(true),
    refreshConfig: () => dataCacheService.getConfig(true),
    refreshAll: () => dataCacheService.refreshAll(),
    
    // Cache management
    clearCache: () => store.clearCache(),
    clearSessionsCache: () => store.clearSessionsCache(),
    clearScriptsCache: () => store.clearScriptsCache(),
    clearConfigCache: () => store.clearConfigCache(),
  };
};

/**
 * Hook for sessions-specific cache operations
 */
export const useSessionsCache = () => {
  const cache = useCache();
  
  return {
    sessions: cache.sessions,
    loading: cache.loading.sessions,
    error: cache.errors.sessions,
    lastUpdated: cache.lastUpdated.sessions,
    isStale: () => cache.isStale('sessions'),
    hasData: () => cache.hasData('sessions'),
    refresh: cache.refreshSessions,
    clear: cache.clearSessionsCache,
  };
};

/**
 * Hook for scripts-specific cache operations
 */
export const useScriptsCache = () => {
  const cache = useCache();
  
  return {
    scripts: cache.scripts,
    loading: cache.loading.scripts,
    error: cache.errors.scripts,
    lastUpdated: cache.lastUpdated.scripts,
    isStale: () => cache.isStale('scripts'),
    hasData: () => cache.hasData('scripts'),
    refresh: cache.refreshScripts,
    clear: cache.clearScriptsCache,
  };
};

/**
 * Hook for config-specific cache operations
 */
export const useConfigCache = () => {
  const cache = useCache();
  
  return {
    config: cache.config,
    loading: cache.loading.config,
    error: cache.errors.config,
    lastUpdated: cache.lastUpdated.config,
    isStale: () => cache.isStale('config'),
    hasData: () => cache.hasData('config'),
    refresh: cache.refreshConfig,
    clear: cache.clearConfigCache,
  };
}; 