import * as vscode from 'vscode';
import { CreateScript, Script } from 'codestate-core';
import { ErrorHandler } from '../../shared/errors/ErrorHandler';
import { ExtensionError, ErrorContext } from '../../shared/errors/ExtensionError';

export class AddScriptCommand {
  private static errorHandler: ErrorHandler;

  static async execute(): Promise<void> {
    try {
      if (!this.errorHandler) {
        this.errorHandler = ErrorHandler.getInstance();
      }

      // Get current workspace
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        throw new Error('No workspace folder is open');
      }

      const projectRoot = workspaceFolders[0].uri.fsPath;

      // Prompt for script name
      const scriptName = await vscode.window.showInputBox({
        prompt: 'Enter script name',
        placeHolder: 'e.g., Build, Test, Deploy',
        validateInput: (value) => {
          if (!value || value.trim().length === 0) {
            return 'Script name is required';
          }
          return null;
        }
      });

      if (!scriptName) {
        return; // User cancelled
      }

      // Prompt for script command
      const scriptCommand = await vscode.window.showInputBox({
        prompt: 'Enter script command',
        placeHolder: 'e.g., npm run build, npm test, docker build .',
        validateInput: (value) => {
          if (!value || value.trim().length === 0) {
            return 'Script command is required';
          }
          return null;
        }
      });

      if (!scriptCommand) {
        return; // User cancelled
      }

      // Create CreateScript instance and execute
      const createScript = new CreateScript();
      const result = await createScript.execute({
        name: scriptName,
        script: scriptCommand,
        rootPath: projectRoot
      });

      if (result.ok) {
        vscode.window.showInformationMessage(`Script "${scriptName}" added successfully!`);
      } else {
        throw new Error(result.error.message);
      }

    } catch (error) {
      const extensionError = error instanceof ExtensionError ? error : ExtensionError.fromError(
        error instanceof Error ? error : new Error(String(error)),
        undefined,
        ErrorContext.CONFIGURATION
      );
      
      this.errorHandler.handleError(extensionError, ErrorContext.CONFIGURATION, true);
      
      vscode.window.showErrorMessage(
        'Failed to add script. Check the output panel for details.',
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
    return vscode.commands.registerCommand('codestate.script.add', () => {
      this.execute();
    });
  }
}
