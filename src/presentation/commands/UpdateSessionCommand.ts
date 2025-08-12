import * as vscode from 'vscode';
import { UpdateSession, ListSessions, Session, FileState, GitState, GitService } from 'codestate-core';
import { ErrorHandler } from '../../shared/errors/ErrorHandler';
import { ExtensionError, ErrorContext } from '../../shared/errors/ExtensionError';
import { Messages } from '../../shared/constants/Messages';

export class UpdateSessionCommand {
  private static errorHandler: ErrorHandler;

  static async execute(sessionToUpdate?: Session): Promise<void> {
    try {
      if (!this.errorHandler) {
        this.errorHandler = ErrorHandler.getInstance();
      }

      // Check if workspace is open
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage(Messages.WORKSPACE_REQUIRED);
        return;
      }

      let session: Session;

      if (sessionToUpdate) {
        // Use the provided session
        session = sessionToUpdate;
      } else {
        // Get session from user selection
        const selectedSession = await this.selectSessionToUpdate();
        if (!selectedSession) {
          return; // User cancelled
        }
        session = selectedSession;
      }

      // Show progress with detailed steps
      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Updating session...',
        cancellable: false,
      }, async (progress) => {
        progress.report({ increment: 0, message: 'Capturing current state...' });

        // Capture current VS Code state
        progress.report({ increment: 30, message: 'Capturing VS Code state...' });
        const files = await this.captureFileStates();
        
        // Capture git state
        progress.report({ increment: 20, message: 'Capturing git state...' });
        const git = await this.captureGitState(session.projectRoot);

        // Get updated metadata
        progress.report({ increment: 20, message: 'Getting session updates...' });
        const { notes, tags } = await this.getSessionUpdates(session);

        // Update session
        progress.report({ increment: 30, message: 'Updating session...' });
        const updateSession = new UpdateSession();
        const result = await updateSession.execute(session.id, {
          notes,
          tags,
          files,
          git,
          extensions: {}
        });

        if (!result.ok) {
          throw new Error(`Failed to update session: ${result.error.message}`);
        }

        progress.report({ increment: 20, message: 'Session updated successfully!' });
      });

      // Show success message
      vscode.window.showInformationMessage(
        `Session "${session.name}" updated successfully!`
      );

    } catch (error) {
      const extensionError = error instanceof ExtensionError ? error : ExtensionError.fromError(
        error instanceof Error ? error : new Error(String(error)),
        undefined,
        ErrorContext.SESSION_MANAGEMENT
      );
      
      this.errorHandler.handleError(extensionError, ErrorContext.SESSION_MANAGEMENT, true);
      
      vscode.window.showErrorMessage(
        'Failed to update session. Check the output panel for details.',
        'Show Details',
        'Dismiss'
      ).then(selection => {
        if (selection === 'Show Details') {
          this.errorHandler.showOutputChannel();
        }
      });
    }
  }

  private static async selectSessionToUpdate(): Promise<Session | undefined> {
    const projectRoot = vscode.workspace.workspaceFolders![0].uri.fsPath;

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
      vscode.window.showInformationMessage('No sessions found for this project. Save a session first.');
      return undefined;
    }

    // Show session picker
    const sessionItems = sessions.map(session => ({
      label: session.name,
      description: session.notes || '',
      detail: `Updated: ${session.updatedAt.toLocaleDateString()} | Tags: ${session.tags.join(', ')}`,
      session
    }));

    const selected = await vscode.window.showQuickPick(sessionItems, {
      placeHolder: 'Select a session to update',
      matchOnDescription: true,
      matchOnDetail: true
    });

    return selected?.session;
  }

  private static async getSessionUpdates(session: Session): Promise<{ notes?: string; tags: string[] }> {
    // Prompt for updated notes
    const notes = await vscode.window.showInputBox({
      prompt: 'Session notes (optional)',
      placeHolder: 'Describe what you\'re working on...',
      value: session.notes || ''
    });

    // Prompt for updated tags
    const tagsInput = await vscode.window.showInputBox({
      prompt: 'Tags (comma-separated, optional)',
      placeHolder: 'feature, auth, frontend',
      value: session.tags.join(', ')
    });

    const tags = tagsInput ? 
      tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : 
      [];

    return { notes, tags };
  }

  private static async captureFileStates(): Promise<FileState[]> {
    const files: FileState[] = [];
    const visibleEditors = vscode.window.visibleTextEditors;
    
    for (const editor of visibleEditors) {
      const document = editor.document;
      const position = editor.selection.active;
      
      files.push({
        path: document.fileName,
        cursor: {
          line: position.line,
          column: position.character
        },
        scroll: {
          top: 0, // VS Code doesn't expose scroll position directly
          left: 0
        },
        isActive: document === vscode.window.activeTextEditor?.document
      });
    }

    return files;
  }

  private static async captureGitState(projectRoot: string): Promise<GitState> {
    try {
      const gitService = new GitService(projectRoot);
      
      // Check if this is a git repository
      const isGitRepo = await gitService.isGitRepository();
      if (!isGitRepo.ok || !isGitRepo.value) {
        return {
          branch: 'unknown',
          commit: 'unknown',
          isDirty: false,
          stashId: null
        };
      }

      // Get current branch
      const branchResult = await gitService.getCurrentBranch();
      const branch = branchResult.ok ? branchResult.value : 'unknown';

      // Get current commit
      const commitResult = await gitService.getCurrentCommit();
      const commit = commitResult.ok ? commitResult.value : 'unknown';

      // Check if repository is dirty
      const isDirtyResult = await gitService.getIsDirty();
      const isDirty = isDirtyResult.ok ? isDirtyResult.value : false;

      // If repository is dirty, create a stash
      let stashId: string | null = null;
      if (isDirty) {
        const stashResult = await gitService.createStash(`CodeState session update: ${new Date().toISOString()}`);
        if (stashResult.ok && stashResult.value.success) {
          stashId = stashResult.value.stashId || null;
        }
      }

      return {
        branch,
        commit,
        isDirty: false, // Set to false since we stashed changes
        stashId
      };

    } catch (error) {
      console.warn('Failed to capture git state:', error);
      return {
        branch: 'unknown',
        commit: 'unknown',
        isDirty: false,
        stashId: null
      };
    }
  }

  static register(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.commands.registerCommand('codestate.updateSession', () => {
      this.execute();
    });
  }
}
