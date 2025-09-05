import * as vscode from 'vscode';
import { UpdateTerminalCollection, TerminalCollection, ScriptReference, LifecycleEvent } from '@codestate/core';
import { ErrorHandler } from '../../shared/errors/ErrorHandler';
import { ExtensionError, ErrorContext } from '../../shared/errors/ExtensionError';
import { DataCacheService } from '../../infrastructure/services/DataCacheService';

export class UpdateTerminalCollectionCommand {
  private static errorHandler: ErrorHandler;

  static async execute(
    terminalCollectionData?: {
      id?: string;
      name?: string;
      rootPath?: string;
      lifecycle?: LifecycleEvent[];
      scriptReferences?: ScriptReference[];
      closeTerminalAfterExecution?: boolean;
    }
  ): Promise<void> {
    console.log('UpdateTerminalCollectionCommand executed with data:', terminalCollectionData);
    
    try {
      if (!this.errorHandler) {
        this.errorHandler = ErrorHandler.getInstance();
      }

      if (!terminalCollectionData) {
        throw new Error('No terminal collection data provided');
      }

      const { name, rootPath, lifecycle, scriptReferences, closeTerminalAfterExecution } = terminalCollectionData;

      if (!name || !name.trim()) {
        throw new Error('Terminal collection name is required');
      }

      if (!rootPath || !rootPath.trim()) {
        throw new Error('Root path is required');
      }

      // Show progress indicator
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Updating terminal collection...',
          cancellable: false
        },
        async (progress) => {
          progress.report({ increment: 0, message: 'Validating collection data...' });

          progress.report({ increment: 30, message: 'Updating terminal collection...' });

          // Execute UpdateTerminalCollection
          const updateTerminalCollection = new UpdateTerminalCollection();
          const result = await updateTerminalCollection.execute(name.trim(), rootPath, {
            lifecycle,
            scriptReferences,
            closeTerminalAfterExecution
          });

          if (!result.ok) {
            throw new Error(`Failed to update terminal collection: ${result.error.message}`);
          }

          progress.report({ increment: 70, message: 'Finalizing collection...' });

          // Clear terminal collections cache to ensure fresh data
          const dataCacheService = DataCacheService.getInstance();
          dataCacheService.clearTerminalCollectionsCache();

          progress.report({ increment: 100, message: 'Terminal collection updated successfully!' });
        }
      );

      // Show success message
      vscode.window.showInformationMessage(
        `Terminal collection "${name}" updated successfully!`,
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
        ErrorContext.SESSION_MANAGEMENT
      );
      
      this.errorHandler.handleError(extensionError, ErrorContext.SESSION_MANAGEMENT, true);
      
      vscode.window.showErrorMessage(
        'Failed to update terminal collection. Check the output panel for details.',
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
    return vscode.commands.registerCommand('codestate.updateTerminalCollection', async (terminalCollectionData) => {
      await UpdateTerminalCollectionCommand.execute(terminalCollectionData);
    });
  }
} 