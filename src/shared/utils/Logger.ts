import * as vscode from 'vscode';

/**
 * Logger utility that overrides console methods to suppress logging in production
 */

interface LoggerConfig {
  enableLogging: boolean;
  enableWarnings: boolean;
  enableDebug: boolean;
  enableInfo: boolean;
  enableError: boolean;
}

class Logger {
  private config: LoggerConfig;
  private originalConsole: {
    log: typeof console.log;
    warn: typeof console.warn;
    debug: typeof console.debug;
    error: typeof console.error;
    info: typeof console.info;
  };

  constructor() {
    this.config = {
      enableLogging: false,
      enableWarnings: false,
      enableDebug: false,
      enableInfo: false,
      enableError: true // Always keep errors enabled
    };

    // Store original console methods
    this.originalConsole = {
      log: console.log,
      warn: console.warn,
      debug: console.debug,
      error: console.error,
      info: console.info
    };

    this.updateConfigFromSettings();
    this.setupConsoleOverrides();
  }

  private updateConfigFromSettings(): void {
    try {
      const config = vscode.workspace.getConfiguration('codestate');
      const loggingEnabled = config.get<boolean>('logging.enabled', false);
      const loggingLevel = config.get<string>('logging.level', 'none');

      if (loggingEnabled) {
        switch (loggingLevel) {
          case 'debug':
            this.config.enableDebug = true;
            this.config.enableInfo = true;
            this.config.enableWarnings = true;
            this.config.enableLogging = true;
            break;
          case 'info':
            this.config.enableInfo = true;
            this.config.enableWarnings = true;
            this.config.enableLogging = true;
            break;
          case 'warn':
            this.config.enableWarnings = true;
            this.config.enableLogging = true;
            break;
          case 'error':
            // Only errors are enabled by default
            break;
          case 'none':
          default:
            // All logging disabled except errors
            break;
        }
      }
    } catch (error) {
      // If we can't get settings (e.g., during extension activation), use defaults
      console.error('Failed to load logging configuration:', error);
    }
  }

  private setupConsoleOverrides(): void {
    // Override console.log
    if (!this.config.enableLogging) {
      console.log = (...args: any[]) => {
        // Suppress in production
      };
    }

    // Override console.warn
    if (!this.config.enableWarnings) {
      console.warn = (...args: any[]) => {
        // Suppress in production
      };
    }

    // Override console.debug
    if (!this.config.enableDebug) {
      console.debug = (...args: any[]) => {
        // Suppress in production
      };
    }

    // Override console.info
    if (!this.config.enableInfo) {
      console.info = (...args: any[]) => {
        // Suppress in production
      };
    }

    // Keep console.error enabled by default for critical errors
    // This is not overridden as it might be needed for debugging critical issues
  }

  /**
   * Restore original console methods
   */
  public restoreConsole(): void {
    console.log = this.originalConsole.log;
    console.warn = this.originalConsole.warn;
    console.debug = this.originalConsole.debug;
    console.error = this.originalConsole.error;
    console.info = this.originalConsole.info;
  }

  /**
   * Enable logging temporarily (for debugging)
   */
  public enableLogging(): void {
    this.config.enableLogging = true;
    this.config.enableWarnings = true;
    this.config.enableDebug = true;
    this.config.enableInfo = true;
    this.setupConsoleOverrides();
  }

  /**
   * Disable logging (production mode)
   */
  public disableLogging(): void {
    this.config.enableLogging = false;
    this.config.enableWarnings = false;
    this.config.enableDebug = false;
    this.config.enableInfo = false;
    this.setupConsoleOverrides();
  }

  /**
   * Update configuration from VS Code settings
   */
  public updateFromSettings(): void {
    this.updateConfigFromSettings();
    this.setupConsoleOverrides();
  }

  /**
   * Get current logging configuration
   */
  public getConfig(): LoggerConfig {
    return { ...this.config };
  }
}

// Create and export a singleton instance
export const logger = new Logger();

// Export the class for testing purposes
export { Logger };

// Global function to override console methods
export function setupConsoleOverrides(): void {
  // The logger instance is created when this module is imported
  // This function can be called explicitly if needed
  console.log('Console overrides initialized');
}

// Auto-initialize when module is imported
setupConsoleOverrides();
