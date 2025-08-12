import * as vscode from 'vscode';
import { ExtensionError, ErrorType, ErrorContext } from './ExtensionError';
import { Messages } from '../constants/Messages';

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorCount = 0;
  private warningCount = 0;
  private readonly outputChannel: vscode.OutputChannel;

  private constructor() {
    this.outputChannel = vscode.window.createOutputChannel('CodeState');
  }

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  public handleError(
    error: Error | ExtensionError,
    context?: ErrorContext,
    showUserNotification = true
  ): void {
    const extensionError = this.normalizeError(error, context);
    
    // Log the error
    this.logError(extensionError);
    
    // Increment error count
    this.errorCount++;
    
    // Show user notification if requested
    if (showUserNotification) {
      this.showErrorNotification(extensionError);
    }
  }

  public handleWarning(
    message: string,
    context?: ErrorContext,
    showUserNotification = false
  ): void {
    const warning = new ExtensionError(
      message,
      ErrorType.UNKNOWN,
      context || ErrorContext.INITIALIZATION
    );
    
    // Log the warning
    this.logWarning(warning);
    
    // Increment warning count
    this.warningCount++;
    
    // Show user notification if requested
    if (showUserNotification) {
      this.showWarningNotification(warning);
    }
  }

  public logError(error: ExtensionError): void {
    const timestamp = new Date().toISOString();
    const errorInfo = {
      timestamp,
      type: error.type,
      context: error.context,
      message: error.message,
      code: error.code,
      details: error.details,
      stack: error.stack,
      originalError: error.originalError?.message,
    };

    this.outputChannel.appendLine(`[ERROR] ${timestamp}`);
    this.outputChannel.appendLine(`Type: ${error.type}`);
    this.outputChannel.appendLine(`Context: ${error.context}`);
    this.outputChannel.appendLine(`Message: ${error.message}`);
    
    if (error.code) {
      this.outputChannel.appendLine(`Code: ${error.code}`);
    }
    
    if (error.details) {
      this.outputChannel.appendLine(`Details: ${JSON.stringify(error.details, null, 2)}`);
    }
    
    if (error.stack) {
      this.outputChannel.appendLine(`Stack: ${error.stack}`);
    }
    
    if (error.originalError) {
      this.outputChannel.appendLine(`Original Error: ${error.originalError.message}`);
    }
    
    this.outputChannel.appendLine('---');
  }

  public logWarning(warning: ExtensionError): void {
    const timestamp = new Date().toISOString();
    
    this.outputChannel.appendLine(`[WARNING] ${timestamp}`);
    this.outputChannel.appendLine(`Context: ${warning.context}`);
    this.outputChannel.appendLine(`Message: ${warning.message}`);
    this.outputChannel.appendLine('---');
  }

  public showErrorNotification(error: ExtensionError): void {
    const message = this.getUserFriendlyMessage(error);
    
    // Show error notification
    vscode.window.showErrorMessage(message, 'Show Details', 'Dismiss').then(
      (selection) => {
        if (selection === 'Show Details') {
          this.outputChannel.show();
        }
      }
    );
  }

  public showWarningNotification(warning: ExtensionError): void {
    const message = this.getUserFriendlyMessage(warning);
    
    // Show warning notification
    vscode.window.showWarningMessage(message, 'Show Details', 'Dismiss').then(
      (selection) => {
        if (selection === 'Show Details') {
          this.outputChannel.show();
        }
      }
    );
  }

  public getUserFriendlyMessage(error: ExtensionError): string {
    // Map error contexts to user-friendly messages
    const messageMap: Record<ErrorContext, string> = {
      [ErrorContext.FILE_OPERATIONS]: 'File operation failed',
      [ErrorContext.FILE_OPERATION]: 'File operation failed',
      [ErrorContext.VALIDATION]: 'Validation error',
      [ErrorContext.BACKUP]: 'Backup operation failed',
      [ErrorContext.STATISTICS]: 'Statistics operation failed',
      [ErrorContext.TERMINAL_OPERATIONS]: 'Terminal operation failed',
      [ErrorContext.GIT_OPERATIONS]: 'Git operation failed',
      [ErrorContext.STORAGE_OPERATIONS]: 'Storage operation failed',
      [ErrorContext.CONFIGURATION]: 'Configuration error',
      [ErrorContext.INITIALIZATION]: 'Initialization error',
      [ErrorContext.TREE_VIEW]: 'Tree view error',
      [ErrorContext.SESSION_MANAGEMENT]: 'Session management error',
    };

    const baseMessage = messageMap[error.context] || 'An error occurred';
    
    // Add specific error details if available
    if (error.type === ErrorType.VALIDATION) {
      return `${baseMessage}: ${error.message}`;
    }
    
    if (error.type === ErrorType.NOT_FOUND) {
      return 'Resource not found';
    }
    
    if (error.type === ErrorType.PERMISSION) {
      return `${baseMessage}: Permission denied`;
    }
    
    return baseMessage;
  }

  private normalizeError(error: Error | ExtensionError, context?: ErrorContext): ExtensionError {
    if (error instanceof ExtensionError) {
      return error;
    }
    
    return ExtensionError.fromError(
      error,
      ErrorType.UNKNOWN,
      context || ErrorContext.INITIALIZATION
    );
  }

  public getErrorCount(): number {
    return this.errorCount;
  }

  public getWarningCount(): number {
    return this.warningCount;
  }

  public resetCounts(): void {
    this.errorCount = 0;
    this.warningCount = 0;
  }

  public showOutputChannel(): void {
    this.outputChannel.show();
  }

  public clearOutput(): void {
    this.outputChannel.clear();
  }

  public dispose(): void {
    this.outputChannel.dispose();
  }
} 