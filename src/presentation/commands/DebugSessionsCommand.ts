import * as vscode from 'vscode';
import { ListSessions, GetScripts } from 'codestate-core';
import { ErrorHandler } from '../../shared/errors/ErrorHandler';
import { ExtensionError, ErrorContext } from '../../shared/errors/ExtensionError';

export class DebugSessionsCommand {
  private static errorHandler: ErrorHandler;

  static async execute(): Promise<void> {
    try {
      if (!this.errorHandler) {
        this.errorHandler = ErrorHandler.getInstance();
      }

      console.log('=== Debug Sessions Command Started ===');

      // Test ListSessions
      console.log('Testing ListSessions...');
      try {
        const listSessions = new ListSessions();
        console.log('ListSessions instance created successfully');
        
        const sessionsResult = await listSessions.execute({});
        console.log('ListSessions result:', sessionsResult);
        
        if (sessionsResult.ok) {
          console.log(`Found ${sessionsResult.value.length} sessions`);
          sessionsResult.value.forEach((session, index) => {
            console.log(`Session ${index + 1}:`, {
              name: session.name,
              projectRoot: session.projectRoot,
              files: session.files?.length || 0,
              updatedAt: session.updatedAt
            });
          });
        } else {
          console.error('ListSessions failed:', sessionsResult.error);
        }
      } catch (error) {
        console.error('Error testing ListSessions:', error);
      }

      // Test GetScripts
      console.log('\nTesting GetScripts...');
      try {
        const getScripts = new GetScripts();
        console.log('GetScripts instance created successfully');
        
        const scriptsResult = await getScripts.execute();
        console.log('GetScripts result:', scriptsResult);
        
        if (scriptsResult.ok) {
          console.log(`Found ${scriptsResult.value.length} scripts`);
          scriptsResult.value.forEach((script, index) => {
            console.log(`Script ${index + 1}:`, {
              name: script.name,
              rootPath: script.rootPath,
              script: script.script
            });
          });
        } else {
          console.error('GetScripts failed:', scriptsResult.error);
        }
      } catch (error) {
        console.error('Error testing GetScripts:', error);
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
