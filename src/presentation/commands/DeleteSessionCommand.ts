import * as vscode from 'vscode';
import { DeleteSession, ListSessions, Session } from 'codestate-core';
import { ErrorHandler } from '../../shared/errors/ErrorHandler';
import { ExtensionError, ErrorContext } from '../../shared/errors/ExtensionError';

export class DeleteSessionCommand {
  private static errorHandler: ErrorHandler;

  static async execute(sessionToDelete?: Session): Promise<void> {
    try {
      if (!this.errorHandler) {
        this.errorHandler = ErrorHandler.getInstance();
      }

      let session: Session;

      if (sessionToDelete) {
        // Use the provided session
        session = sessionToDelete;
      } else {
        // Get current workspace
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
          throw new Error('No workspace folder is open');
        }

        const projectRoot = workspaceFolders[0].uri.fsPath;

        // Get available sessions for this project
        const listSessions = new ListSessions();
        const sessionsResult = await listSessions.execute({
          search: projectRoot
        });

        if (!sessionsResult.ok) {
          throw new Error('Failed to load sessions');
        }

        const sessions = sessionsResult.value.filter(session => 
          session.projectRoot === projectRoot
        );

        if (sessions.length === 0) {
          vscode.window.showInformationMessage('No sessions found for this project.');
          return;
        }

        // Show session picker
        const sessionItems = sessions.map(session => ({
          label: session.name,
          description: session.notes || '',
          detail: `Updated: ${session.updatedAt.toLocaleDateString()} | Files: ${session.files.length} | Tags: ${session.tags.join(', ')}`,
          session
        }));

        const selected = await vscode.window.showQuickPick(sessionItems, {
          placeHolder: 'Select a session to delete',
          matchOnDescription: true,
          matchOnDetail: true
        });

        if (!selected) {
          return; // User cancelled
        }

        session = selected.session;
      }

      // Show confirmation dialog
      const confirm = await vscode.window.showWarningMessage(
        `Delete session "${session.name}"? This action cannot be undone.`,
        'Delete',
        'Cancel'
      );

      if (confirm !== 'Delete') {
        return;
      }

      // Show progress
      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Deleting session: ${session.name}`,
        cancellable: false
      }, async (progress) => {
        progress.report({ message: 'Deleting session...', increment: 50 });

        // Delete the session using codestate-core
        const deleteSession = new DeleteSession();
        const result = await deleteSession.execute(session.id);

        if (!result.ok) {
          throw new Error(`Failed to delete session: ${result.error.message}`);
        }

        progress.report({ message: 'Session deleted successfully!', increment: 50 });
      });

      vscode.window.showInformationMessage(`Session "${session.name}" deleted successfully!`);

    } catch (error) {
      const extensionError = error instanceof ExtensionError ? error : ExtensionError.fromError(
        error instanceof Error ? error : new Error(String(error)),
        undefined,
        ErrorContext.CONFIGURATION
      );
      
      this.errorHandler.handleError(extensionError, ErrorContext.CONFIGURATION, true);
      
      vscode.window.showErrorMessage(
        'Failed to delete session. Check the output panel for details.',
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
    return vscode.commands.registerCommand('codestate.deleteSession', () => {
      this.execute();
    });
  }
}
