import { ListSessions, GetScripts, GetConfig, ListTerminalCollections, isSuccess } from '@codestate/core';
import { useCacheStore } from '../../shared/stores/cacheStore';
import { ErrorHandler } from '../../shared/errors/ErrorHandler';
import { ExtensionError, ErrorContext } from '../../shared/errors/ExtensionError';

export class DataCacheService {
  private static instance: DataCacheService;
  private errorHandler: ErrorHandler;

  private constructor() {
    this.errorHandler = ErrorHandler.getInstance();
  }

  public static getInstance(): DataCacheService {
    if (!DataCacheService.instance) {
      DataCacheService.instance = new DataCacheService();
    }
    return DataCacheService.instance;
  }

  /**
   * Get sessions from cache or fetch from core if stale
   */
  public async getSessions(forceRefresh: boolean = false): Promise<void> {
    const store = useCacheStore.getState();
    
    // Check if we need to fetch data
    if (!forceRefresh && store.hasData('sessions') && !store.isStale('sessions')) {
      return; // Data is fresh in cache
    }

    try {
      store.setLoading('sessions', true);
      store.setError('sessions', null);

      const listSessions = new ListSessions();
      const result = await listSessions.execute({});

      if (isSuccess(result)) {
        store.setSessions(result.value);
      } else {
        const error = new ExtensionError(
          'Failed to fetch sessions',
          undefined,
          ErrorContext.SESSION_MANAGEMENT
        );
        store.setError('sessions', error.message);
        this.errorHandler.handleError(error, ErrorContext.SESSION_MANAGEMENT, false);
      }
    } catch (error) {
      const extensionError = error instanceof ExtensionError ? error : ExtensionError.fromError(
        error instanceof Error ? error : new Error(String(error)),
        undefined,
        ErrorContext.SESSION_MANAGEMENT
      );
      store.setError('sessions', extensionError.message);
      this.errorHandler.handleError(extensionError, ErrorContext.SESSION_MANAGEMENT, false);
    } finally {
      store.setLoading('sessions', false);
    }
  }

  /**
   * Get scripts from cache or fetch from core if stale
   */
  public async getScripts(forceRefresh: boolean = false): Promise<void> {
    const store = useCacheStore.getState();
    
    // Check if we need to fetch data
    if (!forceRefresh && store.hasData('scripts') && !store.isStale('scripts')) {
      return; // Data is fresh in cache
    }

    try {
      store.setLoading('scripts', true);
      store.setError('scripts', null);

      const getScripts = new GetScripts();
      const result = await getScripts.execute();

      if (isSuccess(result)) {
        store.setScripts(result.value);
      } else {
        const error = new ExtensionError(
          'Failed to fetch scripts',
          undefined,
          ErrorContext.STORAGE_OPERATIONS
        );
        store.setError('scripts', error.message);
        this.errorHandler.handleError(error, ErrorContext.STORAGE_OPERATIONS, false);
      }
    } catch (error) {
      const extensionError = error instanceof ExtensionError ? error : ExtensionError.fromError(
        error instanceof Error ? error : new Error(String(error)),
        undefined,
        ErrorContext.STORAGE_OPERATIONS
      );
      store.setError('scripts', extensionError.message);
      this.errorHandler.handleError(extensionError, ErrorContext.STORAGE_OPERATIONS, false);
    } finally {
      store.setLoading('scripts', false);
    }
  }

  /**
   * Get configuration from cache or fetch from core if stale
   */
  public async getConfig(forceRefresh: boolean = false): Promise<void> {
    const store = useCacheStore.getState();
    
    // Check if we need to fetch data
    if (!forceRefresh && store.hasData('config') && !store.isStale('config')) {
      return; // Data is fresh in cache
    }

    try {
      store.setLoading('config', true);
      store.setError('config', null);

      const getConfig = new GetConfig();
      const result = await getConfig.execute();

      if (isSuccess(result)) {
        store.setConfig(result.value);
      } else {
        const error = new ExtensionError(
          'Failed to fetch configuration',
          undefined,
          ErrorContext.CONFIGURATION
        );
        store.setError('config', error.message);
        this.errorHandler.handleError(error, ErrorContext.CONFIGURATION, false);
      }
    } catch (error) {
      const extensionError = error instanceof ExtensionError ? error : ExtensionError.fromError(
        error instanceof Error ? error : new Error(String(error)),
        undefined,
        ErrorContext.CONFIGURATION
      );
      store.setError('config', extensionError.message);
      this.errorHandler.handleError(extensionError, ErrorContext.CONFIGURATION, false);
    } finally {
      store.setLoading('config', false);
    }
  }

  /**
   * Get terminal collections from cache or fetch from core if stale
   */
  public async getTerminalCollections(forceRefresh: boolean = false): Promise<void> {
    const store = useCacheStore.getState();
    
    // Check if we need to fetch data
    if (!forceRefresh && store.hasData('terminalCollections') && !store.isStale('terminalCollections')) {
      return; // Data is fresh in cache
    }

    try {
      store.setLoading('terminalCollections', true);
      store.setError('terminalCollections', null);

      const listTerminalCollections = new ListTerminalCollections();
      const result = await listTerminalCollections.execute();

      if (isSuccess(result)) {
        store.setTerminalCollections(result.value);
      } else {
        const error = new ExtensionError(
          'Failed to fetch terminal collections',
          undefined,
          ErrorContext.STORAGE_OPERATIONS
        );
        store.setError('terminalCollections', error.message);
        this.errorHandler.handleError(error, ErrorContext.STORAGE_OPERATIONS, false);
      }
    } catch (error) {
      const extensionError = error instanceof ExtensionError ? error : ExtensionError.fromError(
        error instanceof Error ? error : new Error(String(error)),
        undefined,
        ErrorContext.STORAGE_OPERATIONS
      );
      store.setError('terminalCollections', extensionError.message);
      this.errorHandler.handleError(extensionError, ErrorContext.CONFIGURATION, false);
    } finally {
      store.setLoading('terminalCollections', false);
    }
  }

  /**
   * Refresh all cached data
   */
  public async refreshAll(): Promise<void> {
    await Promise.all([
      this.getSessions(true),
      this.getScripts(true),
      this.getConfig(true),
      this.getTerminalCollections(true)
    ]);
  }

  /**
   * Clear all cached data
   */
  public clearAllCache(): void {
    useCacheStore.getState().clearCache();
  }

  /**
   * Clear specific cache
   */
  public clearSessionsCache(): void {
    useCacheStore.getState().clearSessionsCache();
  }

  public clearScriptsCache(): void {
    useCacheStore.getState().clearScriptsCache();
  }

  public clearConfigCache(): void {
    useCacheStore.getState().clearConfigCache();
  }

  public clearTerminalCollectionsCache(): void {
    useCacheStore.getState().clearTerminalCollectionsCache();
  }
} 