import { ErrorHandler } from '../../shared/errors/ErrorHandler';
import { ExtensionError, ErrorContext } from '../../shared/errors/ExtensionError';
import { GetConfig, UpdateConfig, isSuccess, type Config } from "@codestate/core";
import { useCacheStore } from '../../shared/stores/cacheStore';

export class ConfigService {
  private static instance: ConfigService;
  private errorHandler: ErrorHandler;

  private constructor() {
    this.errorHandler = ErrorHandler.getInstance();
  }

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  public async getConfig(): Promise<Config | null> {
    const store = useCacheStore.getState();
    
    // Check if we have cached config and it's still fresh
    if (store.hasData('config') && !store.isStale('config')) {
      return store.config;
    }

    try {
      store.setLoading('config', true);
      store.setError('config', null);

      // Fetch fresh config from core package
      const getConfig = new GetConfig();
      const result = await getConfig.execute();

      if (isSuccess(result)) {
        store.setConfig(result.value);
        return result.value;
      } else {
        const extensionError = ExtensionError.fromError(
          new Error('Failed to fetch configuration'),
          undefined,
          ErrorContext.CONFIGURATION
        );
        store.setError('config', extensionError.message);
        this.errorHandler.handleError(extensionError, ErrorContext.CONFIGURATION, false);
        return null;
      }
    } catch (error) {
      const extensionError = error instanceof ExtensionError ? error : ExtensionError.fromError(
        error instanceof Error ? error : new Error(String(error)),
        undefined,
        ErrorContext.CONFIGURATION
      );
      store.setError('config', extensionError.message);
      this.errorHandler.handleError(extensionError, ErrorContext.CONFIGURATION, false);
      return null;
    } finally {
      store.setLoading('config', false);
    }
  }

  public async refreshConfig(): Promise<void> {
    const store = useCacheStore.getState();
    store.clearConfigCache();
    await this.getConfig();
  }

  public async saveConfig(config: Config): Promise<boolean> {
    try {
      const updateConfig = new UpdateConfig();
      const result = await updateConfig.execute(config);

      if (isSuccess(result)) {
        // Update cached config
        const store = useCacheStore.getState();
        store.setConfig(config);
        return true;
      } else {
        const extensionError = ExtensionError.fromError(
          new Error(`Failed to save configuration: ${result.error.message || 'Unknown error'}`),
          undefined,
          ErrorContext.CONFIGURATION
        );
        this.errorHandler.handleError(extensionError, ErrorContext.CONFIGURATION, false);
        return false;
      }
    } catch (error) {
      const extensionError = error instanceof ExtensionError ? error : ExtensionError.fromError(
        error instanceof Error ? error : new Error(String(error)),
        undefined,
        ErrorContext.CONFIGURATION
      );
      this.errorHandler.handleError(extensionError, ErrorContext.CONFIGURATION, false);
      return false;
    }
  }

  public getCachedConfig(): Config | null {
    return useCacheStore.getState().config;
  }
}
