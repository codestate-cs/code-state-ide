# Zustand Integration Guide

This document explains how to use the new Zustand-based caching system in the CodeState IDE extension.

## Overview

The extension now uses Zustand for state management, providing:
- **Centralized cache state** for sessions, scripts, and configuration
- **Automatic cache invalidation** with TTL-based expiration
- **Loading and error states** for better UX
- **Reactive updates** when cache changes
- **Performance improvements** by reducing core API calls

## Architecture

### Store Structure

```typescript
interface CacheState {
  // Data
  sessions: Session[];
  scripts: Script[];
  config: Config | null;
  
  // Loading states
  loading: {
    sessions: boolean;
    scripts: boolean;
    config: boolean;
  };
  
  // Error states
  errors: {
    sessions: string | null;
    scripts: string | null;
    config: string | null;
  };
  
  // Cache metadata
  lastUpdated: {
    sessions: number | null;
    scripts: number | null;
    config: number | null;
  };
}
```

### Cache TTL (Time To Live)

- **Sessions**: 5 minutes
- **Scripts**: 10 minutes  
- **Configuration**: 30 minutes

## Usage

### 1. Direct Store Access

```typescript
import { useCacheStore } from '../../shared/stores/cacheStore';

// Get current state
const store = useCacheStore.getState();
const sessions = store.sessions;
const isLoading = store.loading.sessions;

// Update state
store.setSessions(newSessions);
store.setLoading('sessions', true);
```

### 2. Using the DataCacheService

```typescript
import { DataCacheService } from '../../infrastructure/services/DataCacheService';

const dataCacheService = DataCacheService.getInstance();

// Fetch data (uses cache if fresh)
await dataCacheService.getSessions();
await dataCacheService.getScripts();
await dataCacheService.getConfig();

// Force refresh
await dataCacheService.getSessions(true);

// Clear specific caches
dataCacheService.clearSessionsCache();
dataCacheService.clearScriptsCache();
dataCacheService.clearConfigCache();
```

### 3. Using Custom Hooks

```typescript
import { useCache, useSessionsCache, useScriptsCache, useConfigCache } from '../../shared/hooks/useCache';

// General cache hook
const cache = useCache();
const { sessions, loading, errors, refreshSessions } = cache;

// Specific cache hooks
const sessionsCache = useSessionsCache();
const { sessions, loading, error, refresh } = sessionsCache;

const scriptsCache = useScriptsCache();
const { scripts, loading, error, refresh } = scriptsCache;

const configCache = useConfigCache();
const { config, loading, error, refresh } = configCache;
```

## Migration Guide

### Before (Direct Core Calls)

```typescript
// Old way - direct core calls
const listSessions = new ListSessions();
const result = await listSessions.execute({});
if (result.ok) {
  const sessions = result.value;
  // Use sessions...
}
```

### After (Using Cache)

```typescript
// New way - using cache
const dataCacheService = DataCacheService.getInstance();
await dataCacheService.getSessions();

const store = useCacheStore.getState();
const sessions = store.sessions;
// Use sessions...
```

## Best Practices

### 1. Always Use Cache for Read Operations

```typescript
// ✅ Good - uses cache
await dataCacheService.getSessions();
const sessions = useCacheStore.getState().sessions;

// ❌ Bad - bypasses cache
const listSessions = new ListSessions();
const result = await listSessions.execute({});
```

### 2. Clear Cache After Write Operations

```typescript
// After creating/updating/deleting sessions
await saveSession(session);
dataCacheService.clearSessionsCache();

// After creating/updating/deleting scripts  
await saveScript(script);
dataCacheService.clearScriptsCache();
```

### 3. Handle Loading and Error States

```typescript
const store = useCacheStore.getState();

if (store.loading.sessions) {
  // Show loading indicator
}

if (store.errors.sessions) {
  // Show error message
  console.error('Sessions error:', store.errors.sessions);
}
```

### 4. Check Cache Freshness

```typescript
const store = useCacheStore.getState();

if (store.isStale('sessions')) {
  // Cache is stale, refresh data
  await dataCacheService.getSessions();
}
```

## Performance Benefits

### Before Zustand
- Every tree view refresh called core API
- Status bar updates called core API  
- Commands called core API directly
- No data sharing between components

### After Zustand
- Tree views use cached data
- Status bar uses cached data
- Commands use cached data
- Data shared across all components
- Automatic cache invalidation

## Error Handling

The cache system includes comprehensive error handling:

```typescript
const store = useCacheStore.getState();

// Check for errors
if (store.errors.sessions) {
  console.error('Sessions error:', store.errors.sessions);
  // Handle error appropriately
}

// Errors are automatically cleared when data is successfully fetched
```

## Debugging

Use the debug command to inspect cache state:

```typescript
// Run the debug command to see cache state
// codestate.debugSessions
```

This will show:
- Cache contents
- Loading states
- Error states
- Last updated timestamps

## Troubleshooting

### Cache Not Updating

1. Check if cache is stale: `store.isStale('sessions')`
2. Force refresh: `dataCacheService.getSessions(true)`
3. Clear cache: `dataCacheService.clearSessionsCache()`

### Performance Issues

1. Check cache TTL values
2. Monitor cache size
3. Use `store.hasData()` to check if data exists

### Memory Leaks

1. Clear unused caches
2. Monitor store size
3. Use `store.clearCache()` when appropriate

## Future Enhancements

- **Persistent cache** across VS Code sessions
- **Selective cache invalidation** based on file changes
- **Cache compression** for large datasets
- **Background refresh** for better UX
- **Cache analytics** and monitoring 