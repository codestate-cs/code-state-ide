import * as vscode from 'vscode';
import { SaveSession, FileState, GitState, GitService } from 'codestate-core';
import { ErrorHandler } from '../../shared/errors/ErrorHandler';
import { ExtensionError, ErrorContext } from '../../shared/errors/ExtensionError';
import { Messages } from '../../shared/constants/Messages';

export class SaveSessionCommand {
  private static errorHandler: ErrorHandler;

  static async execute(params?: { name?: string; notes?: string; tags?: string[] }): Promise<void> {
    try {
      if (!this.errorHandler) {
        this.errorHandler = ErrorHandler.getInstance();
      }

      // Check for temporary session data from webview
      const tempData = (globalThis as any).__tempSessionData;
      if (tempData && !params) {
        params = tempData;
      }

      // Check if workspace is open
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage(Messages.WORKSPACE_REQUIRED || 'No workspace folder is open');
        return;
      }

      const projectRoot = workspaceFolders[0].uri.fsPath;

      // Get session name from user or use provided parameter
      let sessionName = params?.name;
      if (!sessionName) {
        sessionName = await this.getSessionName();
        if (!sessionName) {
          return; // User cancelled
        }
      }

      // Check if session already exists (only if name was provided by user)
      if (!params?.name) {
        const existingSessions = await this.checkExistingSession(sessionName, projectRoot);
        if (existingSessions) {
          const overwrite = await this.confirmOverwrite(sessionName);
          if (!overwrite) {
            return; // User cancelled
          }
        }
      }

      // Get session metadata from user or use provided parameters
      let notes: string | undefined;
      let tags: string[] = [];
      
      if (params?.notes !== undefined || params?.tags !== undefined) {
        notes = params.notes;
        tags = params.tags || [];
      } else {
        const metadata = await this.getSessionMetadata();
        notes = metadata.notes;
        tags = metadata.tags;
      }

      // Show progress with detailed steps
      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: Messages.SAVING_SESSION || 'Saving session...',
        cancellable: false,
      }, async (progress) => {
        progress.report({ increment: 0, message: 'Preparing to save session...' });

        // Capture current VS Code state
        progress.report({ increment: 20, message: 'Capturing VS Code state...' });
        
        const files = await this.captureFileStates();
        
        // Capture git state
        progress.report({ increment: 20, message: 'Capturing git state...' });
        const git = await this.captureGitState(projectRoot);

        // Create session
        progress.report({ increment: 30, message: 'Creating session...' });
        
        const saveSession = new SaveSession();
        const result = await saveSession.execute({
          name: sessionName,
          projectRoot,
          notes,
          tags,
          files: files.length > 0 ? files : undefined, // Only pass files if we have any
          git,
          extensions: {}
        });

        if (!result.ok) {
          throw new Error(`Failed to save session: ${result.error.message}`);
        }

        progress.report({ increment: 30, message: 'Session saved successfully!' });
        
        // Refresh the tree view immediately after successful save
        vscode.commands.executeCommand('codestate.refreshSessions');
      });

      // Clean up temporary session data if it exists
      if ((globalThis as any).__tempSessionData) {
        delete (globalThis as any).__tempSessionData;
      }

      // Show success message with options
      const action = await vscode.window.showInformationMessage(
        Messages.SESSION_SAVED?.replace('{name}', sessionName) || `Session "${sessionName}" saved successfully!`,
        'View Sessions',
        'Dismiss'
      );

      if (action === 'View Sessions') {
        vscode.commands.executeCommand('codestate.listSessions');
      }

    } catch (error) {
      // Clean up temporary session data if it exists
      if ((globalThis as any).__tempSessionData) {
        delete (globalThis as any).__tempSessionData;
      }

      const extensionError = error instanceof ExtensionError ? error : ExtensionError.fromError(
        error instanceof Error ? error : new Error(String(error)),
        undefined,
        ErrorContext.SESSION_MANAGEMENT
      );
      
      this.errorHandler.handleError(extensionError, ErrorContext.SESSION_MANAGEMENT, true);
      
      vscode.window.showErrorMessage(
        'Failed to save session. Check the output panel for details.',
        'Show Details',
        'Dismiss'
      ).then(selection => {
        if (selection === 'Show Details') {
          this.errorHandler.showOutputChannel();
        }
      });
    }
  }

  private static async getSessionName(): Promise<string | undefined> {
    return await vscode.window.showInputBox({
      prompt: Messages.SAVE_PROMPT || 'Enter session name',
      placeHolder: 'e.g., Feature: User Authentication',
      validateInput: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Session name is required';
        }
        if (value.length > 100) {
          return 'Session name cannot exceed 100 characters';
        }
        if (!/^[a-zA-Z0-9\s\-_]+$/.test(value)) {
          return 'Session name contains invalid characters';
        }
        return null;
      }
    });
  }

  private static async checkExistingSession(sessionName: string, projectRoot: string): Promise<boolean> {
    try {
      const { ListSessions } = await import('codestate-core');
      const listSessions = new ListSessions();
      const result = await listSessions.execute({ search: sessionName });
      
      if (result.ok) {
        return result.value.some(session => 
          session.name === sessionName && session.projectRoot === projectRoot
        );
      }
      return false;
    } catch (error) {
      // If we can't check, assume it doesn't exist
      return false;
    }
  }

  private static async confirmOverwrite(sessionName: string): Promise<boolean> {
    const result = await vscode.window.showWarningMessage(
      `Session "${sessionName}" already exists. Do you want to overwrite it?`,
      'Overwrite',
      'Cancel'
    );
    return result === 'Overwrite';
  }

  private static async getSessionMetadata(): Promise<{ notes?: string; tags: string[] }> {
    // Prompt for optional notes
    const notes = await vscode.window.showInputBox({
      prompt: 'Session notes (optional)',
      placeHolder: 'Describe what you\'re working on...'
    });

    // Prompt for tags
    const tagsInput = await vscode.window.showInputBox({
      prompt: 'Tags (comma-separated, optional)',
      placeHolder: 'feature, auth, frontend'
    });

    const tags = tagsInput ? 
      tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : 
      [];

    return { notes, tags };
  }

  private static async captureFileStates(): Promise<FileState[]> {
    const files: FileState[] = [];
    
    // Get workspace root to filter files
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return files;
    }
    
    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    const activeEditor = vscode.window.activeTextEditor;
    
    // Use the same logic as the webview to capture files
    const documentsToCapture = new Set<vscode.TextDocument>();
    
    // Method 1: Get files from visible editors (most reliable for "opened" files)
    const visibleEditors = vscode.window.visibleTextEditors;
    console.log(`Debug: Visible editors: ${visibleEditors.length}`);
    
    visibleEditors.forEach(editor => {
      console.log(`Debug: Processing visible editor: ${editor.document.fileName}`);
      if (editor.document.uri.scheme === 'file' && !editor.document.isUntitled) {
        if (editor.document.fileName.startsWith(workspaceRoot)) {
          documentsToCapture.add(editor.document);
          console.log(`Debug: Added visible editor: ${editor.document.fileName}`);
        }
      }
    });
    
    // Method 2: Get files from tab groups (backup method)
    try {
      const activeEditorGroups = vscode.window.tabGroups?.all || [];
      console.log(`Debug: Active editor groups: ${activeEditorGroups.length}`);
      
      activeEditorGroups.forEach(group => {
        group.tabs.forEach(tab => {
          if (tab.input && typeof tab.input === 'object' && 'uri' in tab.input) {
            const uri = (tab.input as any).uri;
            if (uri && uri.scheme === 'file') {
              const fileName = uri.fsPath;
              console.log(`Debug: Processing tab: ${fileName}`);
              if (fileName.startsWith(workspaceRoot)) {
                // Try to get the document for this file
                const document = vscode.workspace.textDocuments.find(doc => doc.fileName === fileName);
                if (document) {
                  documentsToCapture.add(document);
                  console.log(`Debug: Added tab: ${fileName}`);
                }
              }
            }
          }
        });
      });
    } catch (error) {
      console.log(`Debug: Error getting tabs: ${error}`);
    }
    
    // Convert set to array and process each document
    const documentsArray = Array.from(documentsToCapture);
    console.log(`Debug: Final documents to capture count: ${documentsArray.length}`);
    
    for (const document of documentsArray) {
      // Find the editor for this document to get cursor position
      const editor = vscode.window.visibleTextEditors.find(e => e.document === document);
      let cursor = { line: 0, column: 0 };
      
      if (editor) {
        // Document is visible, get cursor position from editor
        const position = editor.selection.active;
        cursor = {
          line: position.line,
          column: position.character
        };
      }
      
      // Check if this is the active document
      const isActive = document === activeEditor?.document;
      
      files.push({
        path: document.fileName,
        cursor,
        scroll: {
          top: 0, // VS Code doesn't expose scroll position directly
          left: 0
        },
        isActive
      });
      
      console.log(`Debug: Captured file: ${document.fileName} (active: ${isActive})`);
    }
    
    console.log(`Debug: Final captured files count: ${files.length}`);

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
        const stashResult = await gitService.createStash(`CodeState session: ${new Date().toISOString()}`);
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
      return {
        branch: 'unknown',
        commit: 'unknown',
        isDirty: false,
        stashId: null
      };
    }
  }

  static register(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.commands.registerCommand('codestate.saveSession', () => {
      this.execute();
    });
  }
}
