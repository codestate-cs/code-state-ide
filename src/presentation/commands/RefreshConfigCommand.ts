import * as vscode from 'vscode';
import { ConfigService } from '../../infrastructure/services/ConfigService';
import { ErrorHandler } from '../../shared/errors/ErrorHandler';
import { ExtensionError, ErrorContext } from '../../shared/errors/ExtensionError';
import { Messages } from '../../shared/constants/Messages';
import { ConfigTreeDataProvider } from '../views/ConfigTreeDataProvider';

export class RefreshConfigCommand {
  private static configService: ConfigService;
  private static errorHandler: ErrorHandler;
  private static configTreeProvider: ConfigTreeDataProvider;

  static async execute(): Promise<void> {
    try {
      if (!this.configService) {
        this.configService = ConfigService.getInstance();
      }
      if (!this.errorHandler) {
        this.errorHandler = ErrorHandler.getInstance();
      }

      // Show progress indicator
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Refreshing CodeState configuration...',
          cancellable: false
        },
        async (progress) => {
          progress.report({ increment: 0, message: 'Fetching configuration from core package...' });

          // Refresh the configuration
          await this.configService.refreshConfig();
          
          progress.report({ increment: 50, message: 'Configuration refreshed successfully' });

          // Trigger tree view refresh
          if (this.configTreeProvider) {
            await this.configTreeProvider.refresh();
          }
          
          progress.report({ increment: 100, message: 'Configuration view updated' });
        }
      );

      // Show success message
      vscode.window.showInformationMessage('CodeState configuration refreshed successfully');

    } catch (error) {
      const extensionError = error instanceof ExtensionError ? error : ExtensionError.fromError(
        error instanceof Error ? error : new Error(String(error)),
        undefined,
        ErrorContext.CONFIGURATION
      );
      
      this.errorHandler.handleError(extensionError, ErrorContext.CONFIGURATION, true);
      
      // Show error message to user
      vscode.window.showErrorMessage(
        'Failed to refresh configuration. Check the output panel for details.',
        'Show Details',
        'Dismiss'
      ).then(selection => {
        if (selection === 'Show Details') {
          this.errorHandler.showOutputChannel();
        }
      });
    }
  }

  static register(context: vscode.ExtensionContext, configTreeProvider: ConfigTreeDataProvider): vscode.Disposable {
    this.configTreeProvider = configTreeProvider;
    return vscode.commands.registerCommand('codestate.refreshConfig', () => {
      this.execute();
    });
  }
}
