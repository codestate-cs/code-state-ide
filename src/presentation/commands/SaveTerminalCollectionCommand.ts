import * as vscode from 'vscode';
import { CreateTerminalCollection, TerminalCollection, ScriptReference, LifecycleEvent } from '@codestate/core';
import { ErrorHandler } from '../../shared/errors/ErrorHandler';
import { ExtensionError, ErrorContext } from '../../shared/errors/ExtensionError';
import { DataCacheService } from '../../infrastructure/services/DataCacheService';
import { randomUUID } from 'crypto';



export class SaveTerminalCollectionCommand {
  private static errorHandler: ErrorHandler;

  static async execute(
    terminalCollectionData?: {
      name?: string;
      rootPath?: string;
      lifecycle?: LifecycleEvent[];
      scriptReferences?: ScriptReference[];
      closeTerminalAfterExecution?: boolean;
    }
  ): Promise<void> {

    console.log('SaveTerminalCollectionCommand executed with data:', terminalCollectionData);
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

      // Use passed data or prompt for input
      let name: string;
      let rootPath: string;
      let lifecycle: LifecycleEvent[];
      let scriptReferences: ScriptReference[];
      let closeTerminalAfterExecution: boolean;

      if (terminalCollectionData) {
        // Use passed data
        name = terminalCollectionData.name || '';
        rootPath = terminalCollectionData.rootPath || projectRoot;
        lifecycle = terminalCollectionData.lifecycle || ['open', 'resume'];
        scriptReferences = terminalCollectionData.scriptReferences || [];
        closeTerminalAfterExecution = terminalCollectionData.closeTerminalAfterExecution || false;
      } else {
        // Prompt for input
        const promptName = await this.promptForName();
        if (!promptName) {
          return; // User cancelled
        }
        name = promptName;

        const promptRootPath = await this.promptForRootPath(projectRoot);
        if (!promptRootPath) {
          return; // User cancelled
        }
        rootPath = promptRootPath;

        lifecycle = await this.promptForLifecycle();
        scriptReferences = await this.promptForScriptReferences();
        closeTerminalAfterExecution = await this.promptForCloseTerminalOption();
      }

      // Validate required fields
      if (!name.trim()) {
        throw new Error('Terminal collection name is required');
      }

      if (scriptReferences.length === 0) {
        throw new Error('At least one script must be selected for the terminal collection');
      }

      // Show progress indicator
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Creating terminal collection...',
          cancellable: false
        },
        async (progress) => {
          progress.report({ increment: 0, message: 'Validating collection data...' });

          // Create terminal collection object
          const terminalCollection: TerminalCollection = {
            id: randomUUID(), // Temporary ID that will be replaced by the service
            name: name.trim(),
            rootPath: rootPath,
            lifecycle: lifecycle,
            scriptReferences: scriptReferences,
            closeTerminalAfterExecution: closeTerminalAfterExecution
          };

          progress.report({ increment: 30, message: 'Creating terminal collection...' });

          // Execute CreateTerminalCollection
          const createTerminalCollection = new CreateTerminalCollection();
          const result = await createTerminalCollection.execute(terminalCollection);

          if (!result.ok) {
            throw new Error(`Failed to create terminal collection: ${result.error.message}`);
          }

          progress.report({ increment: 70, message: 'Finalizing collection...' });

          // Clear terminal collections cache to ensure fresh data
          const dataCacheService = DataCacheService.getInstance();
          dataCacheService.clearTerminalCollectionsCache();

          progress.report({ increment: 100, message: 'Terminal collection created successfully!' });
        }
      );

      // Show success message
      vscode.window.showInformationMessage(
        `Terminal collection "${name}" created successfully!`,
        'View Collections',
        'Dismiss'
      ).then((selection) => {
        if (selection === 'View Collections') {
          // Refresh the terminal collections view
          vscode.commands.executeCommand('codestate.terminals.refresh');
        }
      });

      // Refresh the terminal collections view
      await vscode.commands.executeCommand('codestate.terminals.refresh');

    } catch (error) {
      const extensionError = error instanceof ExtensionError ? error : ExtensionError.fromError(
        error instanceof Error ? error : new Error(String(error)),
        undefined,
        ErrorContext.CONFIGURATION
      );
      
      this.errorHandler.handleError(extensionError, ErrorContext.CONFIGURATION, true);
      
      vscode.window.showErrorMessage(
        'Failed to create terminal collection. Check the output panel for details.',
        'Show Details',
        'Dismiss'
      ).then(selection => {
        if (selection === 'Show Details') {
          this.errorHandler.showOutputChannel();
        }
      });
    }
  }

  private static async promptForName(): Promise<string | undefined> {
    return await vscode.window.showInputBox({
      prompt: 'Enter terminal collection name',
      placeHolder: 'e.g., Build & Test, Development Setup, Production Deploy',
      validateInput: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Terminal collection name is required';
        }
        return null;
      }
    });
  }

  private static async promptForRootPath(defaultPath: string): Promise<string | undefined> {
    return await vscode.window.showInputBox({
      prompt: 'Enter root path for the terminal collection',
      placeHolder: defaultPath,
      value: defaultPath,
      validateInput: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Root path is required';
        }
        return null;
      }
    });
  }

  private static async promptForLifecycle(): Promise<LifecycleEvent[]> {
    const options = [
      { label: 'Open', value: 'open' as LifecycleEvent },
      { label: 'Resume', value: 'resume' as LifecycleEvent },
      { label: 'None', value: 'none' as LifecycleEvent }
    ];

    const selected = await vscode.window.showQuickPick(options, {
      placeHolder: 'Select lifecycle events (use Ctrl/Cmd+Click for multiple)',
      canPickMany: true
    });

    return selected?.map(item => item.value) || ['open', 'resume'];
  }

  private static async promptForScriptReferences(): Promise<ScriptReference[]> {
    // For now, return empty array - this would need to be implemented with script selection
    // In a real implementation, you'd show a script picker or get this from the webview
    return [];
  }

  private static async promptForCloseTerminalOption(): Promise<boolean> {
    const result = await vscode.window.showQuickPick(['Yes', 'No'], {
      placeHolder: 'Close terminal after execution?'
    });
    return result === 'Yes';
  }

  static register(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.commands.registerCommand('codestate.saveTerminalCollection', (...args) => {
      SaveTerminalCollectionCommand.execute(args[0]);
    });
  }
} 