import * as vscode from 'vscode';
import { ErrorHandler } from '../../shared/errors/ErrorHandler';
import { ExtensionError, ErrorContext } from '../../shared/errors/ExtensionError';
import { DataCacheService } from '../../infrastructure/services/DataCacheService';
import { useCacheStore } from '../../shared/stores/cacheStore';

export class DebugSessionsCommand {
  private static errorHandler: ErrorHandler;
  private static dataCacheService: DataCacheService;

  static async execute(): Promise<void> {
    try {
      if (!this.errorHandler) {
        this.errorHandler = ErrorHandler.getInstance();
      }
      
      if (!this.dataCacheService) {
        this.dataCacheService = DataCacheService.getInstance();
      }

      console.log('=== Debug Sessions Command Started ===');

      // Test sessions from cache
      console.log('Testing sessions from cache...');
      try {
        await this.dataCacheService.getSessions();
        const store = useCacheStore.getState();
        
        console.log(`Found ${store.sessions.length} sessions in cache`);
        store.sessions.forEach((session, index) => {
          console.log(`Session ${index + 1}:`, {
            name: session.name,
            projectRoot: session.projectRoot,
            files: session.files?.length || 0,
            updatedAt: session.updatedAt
          });
        });
        
        console.log('Cache state:', {
          loading: store.loading.sessions,
          error: store.errors.sessions,
          lastUpdated: store.lastUpdated.sessions
        });
      } catch (error) {
        console.error('Error testing sessions from cache:', error);
      }

      // Test scripts from cache
      console.log('\nTesting scripts from cache...');
      try {
        await this.dataCacheService.getScripts();
        const store = useCacheStore.getState();
        
        console.log(`Found ${store.scripts.length} scripts in cache`);
        store.scripts.forEach((script, index) => {
          console.log(`Script ${index + 1}:`, {
            name: script.name,
            rootPath: script.rootPath,
            script: script.script, // Legacy field
            commands: script.commands?.length || 0,
            lifecycle: script.lifecycle || ['none'],
            executionMode: script.executionMode || 'same-terminal',
            closeTerminalAfterExecution: script.closeTerminalAfterExecution || false
          });
        });
        
        console.log('Cache state:', {
          loading: store.loading.scripts,
          error: store.errors.scripts,
          lastUpdated: store.lastUpdated.scripts
        });
      } catch (error) {
        console.error('Error testing scripts from cache:', error);
      }

      // Test configuration from cache
      console.log('\nTesting configuration from cache...');
      try {
        await this.dataCacheService.getConfig();
        const store = useCacheStore.getState();
        
        if (store.config) {
          console.log('Configuration loaded from cache:', store.config);
        } else {
          console.log('No configuration found in cache');
        }
        
        console.log('Cache state:', {
          loading: store.loading.config,
          error: store.errors.config,
          lastUpdated: store.lastUpdated.config
        });
      } catch (error) {
        console.error('Error testing configuration from cache:', error);
      }

      // Test workspace
      console.log('\nTesting workspace...');
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (workspaceFolders && workspaceFolders.length > 0) {
        console.log(`Workspace folders: ${workspaceFolders.length}`);
        workspaceFolders.forEach((folder, index) => {
          console.log(`Folder ${index + 1}:`, {
            name: folder.name,
            uri: folder.uri.fsPath
          });
        });
      } else {
        console.log('No workspace folders found');
      }

      console.log('=== Debug Sessions Command Completed ===');

      // Show results to user
      vscode.window.showInformationMessage(
        'Debug completed. Check the output panel for detailed information.',
        'Show Output',
        'Dismiss'
      ).then(selection => {
        if (selection === 'Show Output') {
          this.errorHandler.showOutputChannel();
        }
      });

    } catch (error) {
      const extensionError = error instanceof ExtensionError ? error : ExtensionError.fromError(
        error instanceof Error ? error : new Error(String(error)),
        undefined,
        ErrorContext.SESSION_MANAGEMENT
      );
      
      this.errorHandler.handleError(extensionError, ErrorContext.SESSION_MANAGEMENT, true);
      
      vscode.window.showErrorMessage(
        'Debug command failed. Check the output panel for details.',
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
    return vscode.commands.registerCommand('codestate.debugSessions', () => {
      this.execute();
    });
  }
}
