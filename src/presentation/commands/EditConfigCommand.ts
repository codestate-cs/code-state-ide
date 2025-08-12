import * as vscode from 'vscode';
import { ConfigService } from '../../infrastructure/services/ConfigService';
import { ErrorHandler } from '../../shared/errors/ErrorHandler';
import { ExtensionError, ErrorContext } from '../../shared/errors/ExtensionError';
import { ConfigWebviewProvider } from '../webviews/ConfigWebviewProvider';

export class EditConfigCommand {
  private static configService: ConfigService;
  private static errorHandler: ErrorHandler;
  private static webviewProvider: ConfigWebviewProvider;

  static async execute(): Promise<void> {
    try {
      if (!this.configService) {
        this.configService = ConfigService.getInstance();
      }
      if (!this.errorHandler) {
        this.errorHandler = ErrorHandler.getInstance();
      }

      // Get current configuration
      const config = await this.configService.getConfig();
      if (!config) {
        throw new Error('Failed to load configuration');
      }

      // Create webview provider if not exists
      if (!this.webviewProvider) {
        this.webviewProvider = new ConfigWebviewProvider();
      }

      // Show the configuration editor webview
      await this.webviewProvider.show(config);

    } catch (error) {
      const extensionError = error instanceof ExtensionError ? error : ExtensionError.fromError(
        error instanceof Error ? error : new Error(String(error)),
        undefined,
        ErrorContext.CONFIGURATION
      );
      
      this.errorHandler.handleError(extensionError, ErrorContext.CONFIGURATION, true);
      
      // Show error message to user
      vscode.window.showErrorMessage(
        'Failed to open configuration editor. Check the output panel for details.',
        'Show Details',
        'Dismiss'
      ).then(selection => {
        if (selection === 'Show Details') {
          this.errorHandler.showOutputChannel();
        }
      });
    }
  }

  static register(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.commands.registerCommand('codestate.editConfig', () => {
      this.execute();
    });
  }
}
