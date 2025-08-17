import * as vscode from 'vscode';
import { ResumeSession, ListSessions, Session, GitService, Terminal, GetScriptsByRootPath, FileStorage, GetConfig } from 'codestate-core';
import { ErrorHandler } from '../../shared/errors/ErrorHandler';
import { ExtensionError, ErrorContext } from '../../shared/errors/ExtensionError';
import { Messages } from '../../shared/constants/Messages';
import { SessionRestoreUtil } from '../../shared/utils/SessionRestoreUtil';
import * as path from 'path';
import * as fs from 'fs';

export class ResumeSessionCommand {
  private static errorHandler: ErrorHandler;
  private static extensionContext: vscode.ExtensionContext | undefined;

  static async execute(sessionToResume?: Session): Promise<void> {
    try {
      if (!this.errorHandler) {
        this.errorHandler = ErrorHandler.getInstance();
      }



      // Pre-command Git state check
      const preCheckPassed = await this.checkPreCommandGitState();
      if (!preCheckPassed) {
        return; // User cancelled or Git operation failed
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

      // Handle different project root - open new window if needed
      const currentProjectRoot = workspaceFolders[0].uri.fsPath;
      if (currentProjectRoot !== session.projectRoot) {
        // Check if session project root exists
        try {
          await vscode.workspace.fs.stat(vscode.Uri.file(session.projectRoot));
        } catch (error) {
          vscode.window.showErrorMessage(`Project root not found: ${session.projectRoot}`);
          return;
        }

        // Open project folder in new window, then open files
        console.log(`ResumeSessionCommand: Opening new VS Code window for session: ${session.name}`);
        
        try {
          // Get the complete session with files
          const resumeSession = new ResumeSession();
          const result = await resumeSession.execute(session.id);
          
          if (!result.ok) {
            throw new Error(`Failed to load session files: ${result.error.message}`);
          }
          
          if (!result.value || !result.value.files) {
            throw new Error('No files found in session');
          }
          
          const sessionWithFiles = result.value;
          console.log(`ResumeSessionCommand: Loaded session with ${sessionWithFiles.files.length} files`);
          
          // Store session ID for later restoration using the utility
          const storeResult = await SessionRestoreUtil.storeSessionForRestore(session.id);
          
          if (!storeResult) {
            console.error("ResumeSessionCommand: Failed to store session for restore");
            return;
          }
          
          // Open the project folder in a new window
          const folderUri = vscode.Uri.file(session.projectRoot);
          await vscode.commands.executeCommand('vscode.openFolder', folderUri, { forceNewWindow: true });
          
          vscode.window.showInformationMessage(
            `Opening project in new window with ${sessionWithFiles.files.length} files from session "${session.name}".`
          );
          
        } catch (error) {
          console.error("ResumeSessionCommand: Failed to open new window:", error);
          const errorMessage = error instanceof Error ? error.message : String(error);
          vscode.window.showErrorMessage(`Failed to resume session: ${errorMessage}`);
        }
        
        return; // Exit current command
      }

      // Check current Git state before proceeding
      const shouldProceed = await this.checkCurrentGitState(session);
      if (!shouldProceed) {
        return; // User cancelled or there was an error
      }

      // Show confirmation dialog
      const confirm = await this.confirmResume(session);
      if (!confirm) {
        return;
      }

      // Perform the actual resume
      await this.performResume(session);

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
    console.log("ResumeSessionCommand: restoreFileStates called with", session.files.length, "files");
    
    if (!session.files || !Array.isArray(session.files)) {
      console.log("ResumeSessionCommand: No files to restore in this session");
      vscode.window.showWarningMessage('No files to restore in this session');
      return;
    }
    
    // Log the first file to see what we're working with
    if (session.files.length > 0) {
      const firstFile = session.files[0];
      console.log("ResumeSessionCommand: First file details:", {
        path: firstFile.path,
        isActive: firstFile.isActive,
        cursor: firstFile.cursor,
        exists: require('fs').existsSync(firstFile.path),
        workspaceFolders: vscode.workspace.workspaceFolders?.map(f => f.uri.fsPath)
      });
    }
    
    let activeFileRestored = false;
    let activeDocument: vscode.TextDocument | undefined;
    
    // First pass: Open all files as documents
    let openedCount = 0;
    console.log("ResumeSessionCommand: Step 5a - Opening files as documents...");
    for (const fileState of session.files) {
      try {
        // Use the full path directly (no reconstruction needed)
        const fullPath = fileState.path;
        console.log("ResumeSessionCommand: Opening file:", fullPath);
        
        // Check if file exists
        const fileUri = vscode.Uri.file(fullPath);
        try {
          await vscode.workspace.fs.stat(fileUri);
          console.log("ResumeSessionCommand: File exists:", fullPath);
        } catch (error) {
          console.log("ResumeSessionCommand: File does not exist:", fullPath);
          vscode.window.showWarningMessage(`File does not exist: ${fullPath}`);
          continue;
        }
        
        let document: vscode.TextDocument;
        try {
          document = await vscode.workspace.openTextDocument(fullPath);
          openedCount++;
          console.log("ResumeSessionCommand: Successfully opened document:", fullPath);
        } catch (openError) {
          console.error("ResumeSessionCommand: Failed to openTextDocument:", fullPath, openError);
          throw openError; // Re-throw to be caught by outer catch
        }
        
        // Store the active document for later focus
        if (fileState.isActive) {
          activeDocument = document;
          console.log("ResumeSessionCommand: Set as active document:", fullPath);
        }
      } catch (error) {
        console.error("ResumeSessionCommand: Failed to open file:", fileState.path, error);
        vscode.window.showWarningMessage(`Failed to open file: ${fileState.path} - ${error}`);
      }
    }
    
    console.log("ResumeSessionCommand: Opened", openedCount, "documents out of", session.files.length, "files");
    
    // Small delay to ensure all documents are properly loaded
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Second pass: Show all files and restore cursor positions
    let shownCount = 0;
    console.log("ResumeSessionCommand: Step 5b - Showing files in tabs...");
    for (const fileState of session.files) {
      try {
        // Use the full path directly (no reconstruction needed)
        const fullPath = fileState.path;
        console.log("ResumeSessionCommand: Looking for document in memory:", fullPath);
        
        const document = vscode.workspace.textDocuments.find(doc => doc.fileName === fullPath);
        if (!document) {
          console.log("ResumeSessionCommand: Document not found in memory:", fullPath);
          vscode.window.showWarningMessage(`Document not found in memory: ${fullPath}`);
          continue;
        }
        
        console.log("ResumeSessionCommand: Found document in memory, showing in tab:", fullPath);
        // Show the document in a new tab
        const editor = await vscode.window.showTextDocument(document, { 
          preview: false,
          viewColumn: vscode.ViewColumn.One
        });
        shownCount++;
        console.log("ResumeSessionCommand: Successfully showed document in tab:", fullPath);
        
        // Restore cursor position
        if (fileState.cursor) {
          const position = new vscode.Position(
            fileState.cursor.line,
            fileState.cursor.column
          );
          editor.selection = new vscode.Selection(position, position);
          
          // Reveal the cursor position
          editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
          console.log("ResumeSessionCommand: Restored cursor position for:", fullPath, "at line", fileState.cursor.line, "column", fileState.cursor.column);
        }
      } catch (error) {
        // Use the full path directly for error message
        const fullPath = fileState.path;
        console.error("ResumeSessionCommand: Failed to show file:", fullPath, error);
        vscode.window.showWarningMessage(`Failed to show file: ${fullPath} - ${error}`);
      }
    }
    
    console.log("ResumeSessionCommand: Showed", shownCount, "documents in tabs out of", session.files.length, "files");
    
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

  private static async checkCurrentGitState(session: Session): Promise<boolean> {
    const projectRoot = vscode.workspace.workspaceFolders![0].uri.fsPath;
    const gitService = new GitService(projectRoot);
    
    try {
      // Check if this is a Git repository
      const isGitRepo = await gitService.isGitRepository();
      if (!isGitRepo.ok || !isGitRepo.value) {
        // Not a Git repository, proceed without Git checks
        return true;
      }
      
      // Check if repository is dirty (has uncommitted changes)
      const isDirty = await gitService.getIsDirty();
      if (!isDirty.ok) {
        vscode.window.showWarningMessage('Failed to check Git status. Proceeding anyway.');
        return true;
      }
      
      if (isDirty.value) {
        // Repository is dirty, ask user what to do
        const choice = await vscode.window.showWarningMessage(
          'You have uncommitted changes in your Git repository. What would you like to do?',
          'Commit Changes',
          'Cancel'
        );
        
        switch (choice) {
          case 'Commit Changes':
            return await this.handleGitCommit(gitService);
          case 'Cancel':
          default:
            return false;
        }
      }
      
      return true;
    } catch (error) {
      vscode.window.showWarningMessage(`Failed to check Git state: ${error}. Proceeding anyway.`);
      return true;
    }
  }

  private static async handleGitCommit(gitService: GitService): Promise<boolean> {
    try {
      const commitMessage = await vscode.window.showInputBox({
        prompt: 'Enter commit message',
        placeHolder: 'Save current work before resuming session',
        value: 'Save current work before resuming session'
      });
      
      if (!commitMessage) {
        return false; // User cancelled
      }
      
      const result = await gitService.commitChanges(commitMessage);
      if (!result.ok) {
        vscode.window.showErrorMessage(`Failed to commit changes: ${result.error.message || 'Unknown error'}`);
        return false;
      }
      
      if (!result.value) {
        vscode.window.showErrorMessage('Failed to commit changes: Commit operation returned false');
        return false;
      }
      
      vscode.window.showInformationMessage('Changes committed successfully');
      return true;
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to commit changes: ${error}`);
      return false;
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
        // Check if the session branch exists locally
        const terminal = new Terminal();
        const branchExistsResult = await terminal.execute(`git branch --list ${session.git.branch}`, {
          cwd: session.projectRoot
        });
        
        if (!branchExistsResult.ok || !branchExistsResult.value.stdout || branchExistsResult.value.stdout.trim() === '') {
          vscode.window.showErrorMessage(`Git branch not found: ${session.git.branch}`);
          return;
        }

        // Switch to the saved branch automatically
        const switchResult = await terminal.execute(`git checkout ${session.git.branch}`, {
          cwd: session.projectRoot
        });
        
        if (!switchResult.ok) {
          vscode.window.showErrorMessage(`Failed to switch to branch ${session.git.branch}`);
          return;
        }
        
        vscode.window.showInformationMessage(`Switched to branch ${session.git.branch}`);
      }

    } catch (error) {
      vscode.window.showWarningMessage(`Failed to restore Git state: ${error}`);
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

  static async checkPreCommandGitState(): Promise<boolean> {
    try {
      // Check if workspace is open
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        return true; // No workspace, skip Git check
      }

      const projectRoot = workspaceFolders[0].uri.fsPath;
      const gitService = new GitService(projectRoot);

      // Check if this is a Git repository
      const isGitRepo = await gitService.isGitRepository();
      if (!isGitRepo.ok || !isGitRepo.value) {
        return true; // Not a Git repository, proceed
      }

      // Check if repository is dirty
      const isDirty = await gitService.getIsDirty();
      if (!isDirty.ok || !isDirty.value) {
        return true; // Clean repository, proceed
      }

      // Show options - only commit or resume anyway
      const choice = await vscode.window.showWarningMessage(
        'You have uncommitted changes in your Git repository. What would you like to do?',
        'Commit Changes',
        'Cancel'
      );

      switch (choice) {
        case 'Commit Changes':
          return await this.handleGitCommit(gitService);
        case 'Cancel':
        default:
          return false; // User cancelled
      }

    } catch (error) {
      console.warn('Failed to check pre-command Git state:', error);
      // If Git check fails, proceed anyway (fallback to existing checks)
      return true;
    }
  }

  /**
   * Public method to execute session resume by session ID
   * @param sessionId - The session ID to resume
   */
  static async resumeSessionById(sessionId: string): Promise<void> {
    console.log(`ResumeSessionCommand: resumeSessionById called with sessionId: ${sessionId}`);
    await this.executeResumeSession(sessionId);
  }

  private static async executeResumeSession(sessionId: string): Promise<void> {
    try {
      console.log(`ResumeSessionCommand: executeResumeSession called with sessionId: ${sessionId}`);
      
      // Get the complete session with files directly using ResumeSession
      console.log("ResumeSessionCommand: Loading complete session data...");
      const resumeSession = new ResumeSession();
      const result = await resumeSession.execute(sessionId);
      
      console.log("ResumeSessionCommand: ResumeSession result:", {
        ok: result.ok,
        hasValue: result.ok ? !!result.value : false,
        valueType: result.ok ? typeof result.value : 'N/A',
        error: result.ok ? 'N/A' : result.error
      });
      
      if (!result.ok) {
        console.error("ResumeSessionCommand: Failed to load session:", result.error);
        throw new Error(`Failed to load session: ${result.error.message}`);
      }
      
      if (!result.value) {
        console.error("ResumeSessionCommand: result.value is undefined");
        throw new Error('Failed to load session: No session data returned');
      }
      
      const session = result.value;
      console.log(`ResumeSessionCommand: Loaded complete session: ${session.name}`);
      console.log("ResumeSessionCommand: Session files property:", {
        hasFiles: !!session.files,
        filesType: typeof session.files,
        filesLength: session.files?.length
      });
      
      if (!session.files) {
        console.error("ResumeSessionCommand: Session files is undefined");
        throw new Error(`Session "${session.name}" has no files data`);
      }
      
      console.log(`ResumeSessionCommand: Session has ${session.files.length} files`);
      console.log("ResumeSessionCommand: Session files:", session.files.map(f => ({ path: f.path, isActive: f.isActive })));
      
      // Execute the actual resume logic directly
      console.log("ResumeSessionCommand: Starting resume execution...");
      await this.performResume(session);
      console.log("ResumeSessionCommand: Resume execution completed successfully");
    } catch (error) {
      console.error("ResumeSessionCommand: Error in executeResumeSession:", error);
      console.error("ResumeSessionCommand: Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      
      const extensionError = error instanceof ExtensionError ? error : ExtensionError.fromError(
        error instanceof Error ? error : new Error(String(error)),
        undefined,
        ErrorContext.SESSION_MANAGEMENT
      );
      
      this.errorHandler.handleError(extensionError, ErrorContext.SESSION_MANAGEMENT, true);
      
      vscode.window.showErrorMessage(
        `Failed to resume session in new window: ${error instanceof Error ? error.message : String(error)}. Check the output panel for details.`,
        'Show Details',
        'Dismiss'
      ).then(selection => {
        if (selection === 'Show Details') {
          this.errorHandler.showOutputChannel();
        }
      });
    }
  }

  private static async performResume(session: Session): Promise<void> {
    console.log(`ResumeSessionCommand: performResume called for session: ${session.name}`);
    
    try {
      // Show progress with detailed steps
      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: Messages.RESUMING_SESSION || `Resuming session: ${session.name}`,
        cancellable: false
      }, async (progress) => {
        progress.report({ increment: 0, message: 'Session data loaded...' });
        console.log("ResumeSessionCommand: Step 1 - Session data already loaded");

        // Use the session data we already have (complete with files)
        const resumedSession = session;
        console.log(`ResumeSessionCommand: Using session with ${resumedSession.files.length} files`);
        console.log("ResumeSessionCommand: Session files:", resumedSession.files.map(f => ({ path: f.path, isActive: f.isActive })));

        progress.report({ increment: 20, message: 'Closing current files...' });
        console.log("ResumeSessionCommand: Step 2 - Closing current files...");

        // Close all current editors
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
        console.log("ResumeSessionCommand: All editors closed");

        progress.report({ increment: 20, message: 'Restoring git state...' });
        console.log("ResumeSessionCommand: Step 3 - Restoring git state...");

        // Restore git state using the resumed session data
        await this.restoreGitState(resumedSession);
        console.log("ResumeSessionCommand: Git state restored");

        progress.report({ increment: 20, message: 'Executing project scripts...' });
        console.log("ResumeSessionCommand: Step 4 - Executing project scripts...");

        // Execute project scripts
        await this.executeProjectScripts(resumedSession.projectRoot);
        console.log("ResumeSessionCommand: Project scripts executed");

        progress.report({ increment: 20, message: 'Opening files from session...' });
        console.log("ResumeSessionCommand: Step 5 - Opening files from session...");

        // Open files from the resumed session (do this last to avoid interference)
        console.log("ResumeSessionCommand: About to call restoreFileStates...");
        await this.restoreFileStates(resumedSession);
        console.log("ResumeSessionCommand: Files restored");
        
        // Check if files are actually visible
        const visibleEditors = vscode.window.visibleTextEditors;
        console.log("ResumeSessionCommand: Visible editors after restore:", visibleEditors.length);
        visibleEditors.forEach((editor, index) => {
          console.log(`ResumeSessionCommand: Visible editor ${index}:`, editor.document.fileName);
        });

        progress.report({ increment: 20, message: 'Session resumed successfully!' });
        console.log("ResumeSessionCommand: All steps completed successfully");
      });

      vscode.window.showInformationMessage(
        Messages.SESSION_RESUMED?.replace('{name}', session.name) || `Session "${session.name}" resumed successfully!`
      );
      console.log("ResumeSessionCommand: performResume completed successfully");
    } catch (error) {
      console.error("ResumeSessionCommand: Error in performResume:", error);
      console.error("ResumeSessionCommand: Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      throw error; // Re-throw to be caught by executeResumeSession
    }
  }

  static register(context: vscode.ExtensionContext): vscode.Disposable {
    this.extensionContext = context;
    return vscode.commands.registerCommand('codestate.resumeSession', () => {
      this.execute();
    });
  }
}
