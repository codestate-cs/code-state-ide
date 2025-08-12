import * as vscode from 'vscode';
import { ResumeSession, ListSessions, Session, GitService, Terminal, GetScriptsByRootPath } from 'codestate-core';
import { ErrorHandler } from '../../shared/errors/ErrorHandler';
import { ExtensionError, ErrorContext } from '../../shared/errors/ExtensionError';
import { Messages } from '../../shared/constants/Messages';

export class ResumeSessionCommand {
  private static errorHandler: ErrorHandler;

  static async execute(sessionToResume?: Session): Promise<void> {
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

      if (sessionToResume) {
        // Use the provided session
        session = sessionToResume;
      } else {
        // Get session from user selection
        const selectedSession = await this.selectSessionToResume();
        if (!selectedSession) {
          return; // User cancelled
        }
        session = selectedSession;
      }

      // Show confirmation dialog
      const confirm = await this.confirmResume(session);
      if (!confirm) {
        return;
      }

      // Show progress with detailed steps
      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: Messages.RESUMING_SESSION || `Resuming session: ${session.name}`,
        cancellable: false
      }, async (progress) => {
        progress.report({ increment: 0, message: 'Loading session data...' });

        // Resume the session using codestate-core to get complete session data
        const resumeSession = new ResumeSession();
        const result = await resumeSession.execute(session.id);

        if (!result.ok) {
          throw new Error(`Failed to resume session: ${result.error.message}`);
        }

        // Use the session data returned by ResumeSession.execute() which should have files
        const resumedSession = result.value;

        progress.report({ increment: 20, message: 'Closing current files...' });

        // Close all current editors
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');

        progress.report({ increment: 20, message: 'Restoring git state...' });

        // Restore git state using the resumed session data
        await this.restoreGitState(resumedSession);

        progress.report({ increment: 20, message: 'Executing project scripts...' });

        // Execute project scripts
        await this.executeProjectScripts(resumedSession.projectRoot);

        progress.report({ increment: 20, message: 'Opening files from session...' });

        // Open files from the resumed session (do this last to avoid interference)
        await this.restoreFileStates(resumedSession);

        progress.report({ increment: 20, message: 'Session resumed successfully!' });
      });

      vscode.window.showInformationMessage(
        Messages.SESSION_RESUMED?.replace('{name}', session.name) || `Session "${session.name}" resumed successfully!`
      );

    } catch (error) {
      const extensionError = error instanceof ExtensionError ? error : ExtensionError.fromError(
        error instanceof Error ? error : new Error(String(error)),
        undefined,
        ErrorContext.SESSION_MANAGEMENT
      );
      
      this.errorHandler.handleError(extensionError, ErrorContext.SESSION_MANAGEMENT, true);
      
      vscode.window.showErrorMessage(
        'Failed to resume session. Check the output panel for details.',
        'Show Details',
        'Dismiss'
      ).then(selection => {
        if (selection === 'Show Details') {
          this.errorHandler.showOutputChannel();
        }
      });
    }
  }

  private static async selectSessionToResume(): Promise<Session | undefined> {
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
      placeHolder: Messages.RESUME_PROMPT || 'Select a session to resume',
      matchOnDescription: true,
      matchOnDetail: true
    });

    return selected?.session;
  }

  private static async confirmResume(session: Session): Promise<boolean> {
    const result = await vscode.window.showWarningMessage(
      `Resume session "${session.name}"? This will close current files and restore the session state.`,
      'Resume',
      'Cancel'
    );
    return result === 'Resume';
  }

  private static async restoreFileStates(session: Session): Promise<void> {
    if (!session.files || !Array.isArray(session.files)) {
      vscode.window.showWarningMessage('No files to restore in this session');
      return;
    }
    
    let activeFileRestored = false;
    let activeDocument: vscode.TextDocument | undefined;
    
    // First pass: Open all files as documents
    let openedCount = 0;
    for (const fileState of session.files) {
      try {
        // Check if file exists
        const fileUri = vscode.Uri.file(fileState.path);
        try {
          await vscode.workspace.fs.stat(fileUri);
        } catch (error) {
          vscode.window.showWarningMessage(`File does not exist: ${fileState.path}`);
          continue;
        }
        
        const document = await vscode.workspace.openTextDocument(fileState.path);
        openedCount++;
        
        // Store the active document for later focus
        if (fileState.isActive) {
          activeDocument = document;
        }
      } catch (error) {
        vscode.window.showWarningMessage(`Failed to open file: ${fileState.path} - ${error}`);
      }
    }
    
    // Small delay to ensure all documents are properly loaded
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Second pass: Show all files and restore cursor positions
    let shownCount = 0;
    for (const fileState of session.files) {
      try {
        const document = vscode.workspace.textDocuments.find(doc => doc.fileName === fileState.path);
        if (!document) {
          vscode.window.showWarningMessage(`Document not found in memory: ${fileState.path}`);
          continue;
        }
        
        // Show the document in a new tab
        const editor = await vscode.window.showTextDocument(document, { 
          preview: false,
          viewColumn: vscode.ViewColumn.One
        });
        shownCount++;
        
        // Restore cursor position
        if (fileState.cursor) {
          const position = new vscode.Position(
            fileState.cursor.line,
            fileState.cursor.column
          );
          editor.selection = new vscode.Selection(position, position);
          
          // Reveal the cursor position
          editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
        }
      } catch (error) {
        vscode.window.showWarningMessage(`Failed to show file: ${fileState.path} - ${error}`);
      }
    }
    
    // Small delay before focusing active file
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Third pass: Focus the active file if it exists
    if (activeDocument && !activeFileRestored) {
      try {
        await vscode.window.showTextDocument(activeDocument, { 
          preview: false, 
          viewColumn: vscode.ViewColumn.One 
        });
        activeFileRestored = true;
      } catch (error) {
        // Silently continue if active file can't be focused
      }
    }
  }

  private static async restoreGitState(session: Session): Promise<void> {
    try {
      const gitService = new GitService(session.projectRoot);
      
      // Check if this is a git repository
      const isGitRepo = await gitService.isGitRepository();
      if (!isGitRepo.ok || !isGitRepo.value) {
        return;
      }

      // Get current branch
      const currentBranchResult = await gitService.getCurrentBranch();
      const currentBranch = currentBranchResult.ok ? currentBranchResult.value : 'unknown';

      // Check if we need to switch branches
      if (currentBranch !== session.git.branch && session.git.branch !== 'unknown') {
        // Switch to the saved branch
        const terminal = new Terminal();
        const switchResult = await terminal.execute(`git checkout ${session.git.branch}`, {
          cwd: session.projectRoot
        });
        
        if (!switchResult.ok) {
          // Silently continue if branch switch fails
        }
      }

      // Apply stash if there was one
      if (session.git.stashId) {
        const stashResult = await gitService.applyStash(session.git.stashId);
        
        if (stashResult.ok && stashResult.value.success) {
          // Check for conflicts
          if (stashResult.value.conflicts && stashResult.value.conflicts.length > 0) {
            vscode.window.showWarningMessage(
              `Stash conflicts detected. Please resolve conflicts in: ${stashResult.value.conflicts.join(', ')}`
            );
          }
        }
      }

    } catch (error) {
      // Silently continue if git state restoration fails
    }
  }

  private static async executeProjectScripts(projectRoot: string): Promise<void> {
    try {
      // Get scripts for this project root
      const getScripts = new GetScriptsByRootPath();
      const scriptsResult = await getScripts.execute(projectRoot);
      
      if (!scriptsResult.ok || scriptsResult.value.length === 0) {
        return;
      }
      
      const terminal = new Terminal();
      
      // Execute each script in a new terminal
      for (const script of scriptsResult.value) {
        try {
          // Spawn a new terminal for each script
          const spawnResult = await terminal.spawnTerminal(script.script, {
            cwd: projectRoot,
            env: process.env as Record<string, string>
          });
          
          if (!spawnResult.ok) {
            // Silently continue if script execution fails
          }
          
          // Small delay between spawning terminals
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          // Silently continue if script execution fails
        }
      }
      
    } catch (error) {
      // Silently continue if script execution fails
    }
  }

  static register(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.commands.registerCommand('codestate.resumeSession', () => {
      this.execute();
    });
  }
}
