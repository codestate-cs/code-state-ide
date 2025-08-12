import { ErrorHandler } from '../../shared/errors/ErrorHandler';
import { ExtensionError, ErrorContext } from '../../shared/errors/ExtensionError';
import { GetConfig, UpdateConfig, isSuccess, type Config } from "codestate-core";

export class ConfigService {
  private static instance: ConfigService;
  private errorHandler: ErrorHandler;
  private config: Config | null = null;
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 30000; // 30 seconds

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
    try {
      // Check if we have cached config and it's still fresh
      if (this.config && (Date.now() - this.lastFetchTime) < this.CACHE_DURATION) {
        return this.config;
      }

      // Fetch fresh config from core package
      const getConfig = new GetConfig();
      const result = await getConfig.execute();

      if (isSuccess(result)) {
        this.config = result.value;
        this.lastFetchTime = Date.now();
        return this.config;
      } else {
        const extensionError = ExtensionError.fromError(
          new Error('Failed to fetch configuration'),
          undefined,
          ErrorContext.CONFIGURATION
        );
        this.errorHandler.handleError(extensionError, ErrorContext.CONFIGURATION, false);
        return null;
      }
    } catch (error) {
      const extensionError = error instanceof ExtensionError ? error : ExtensionError.fromError(
        error instanceof Error ? error : new Error(String(error)),
        undefined,
        ErrorContext.CONFIGURATION
      );
      this.errorHandler.handleError(extensionError, ErrorContext.CONFIGURATION, false);
      return null;
    }
  }

  public async refreshConfig(): Promise<void> {
    this.config = null;
    this.lastFetchTime = 0;
    await this.getConfig();
  }

  public async saveConfig(config: Config): Promise<boolean> {
    try {
      const updateConfig = new UpdateConfig();
      const result = await updateConfig.execute(config);

      if (isSuccess(result)) {
        // Update cached config
        this.config = config;
        this.lastFetchTime = Date.now();
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
    return this.config;
  }
}
