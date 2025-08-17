import { FileState, ListSessions, Session } from "codestate-core";
import * as vscode from "vscode";
import { ErrorHandler } from "../../shared/errors/ErrorHandler";
import {
  ErrorContext,
  ExtensionError,
} from "../../shared/errors/ExtensionError";

export class SessionWebviewProvider {
  private static readonly viewType = "codestate.session";
  private panel: vscode.WebviewPanel | undefined;
  private errorHandler: ErrorHandler;
  private selectedSession: Session | undefined;
  private mode: "create" | "update" = "create";
  private hasUncommittedChanges: boolean = false;

  constructor() {
    this.errorHandler = ErrorHandler.getInstance();
  }

  async show(mode: "create" | "update" = "create"): Promise<void> {
    this.mode = mode;

    if (mode === "update") {
      // First, show session selection for update mode
      const session = await this.selectSessionToUpdate();
      if (!session) {
        console.log("SessionWebviewProvider: No session selected, cancelling");
        return; // User cancelled
      }

      console.log(
        `SessionWebviewProvider: Session selected, setting selectedSession to "${session.name}" with ID "${session.id}"`
      );
      this.selectedSession = session;
    }

    // Check Git state for uncommitted changes
    await this.checkGitState();

    // Create and show panel with warning if needed
    const baseTitle = mode === "create" ? "Create New Session" : `Update Session: ${this.selectedSession?.name}`;
    const title = this.hasUncommittedChanges ? `${baseTitle} ⚠️` : baseTitle;
    
    this.panel = vscode.window.createWebviewPanel(
      SessionWebviewProvider.viewType,
      title,
      {
        viewColumn: vscode.ViewColumn.One,
        preserveFocus: true,
      },
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [],
      }
    );

    // Set the webview's initial html content
    this.panel.webview.html = this.getWebviewContent();

    // Handle messages from the webview
    this.panel.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case "saveSession":
          await this.handleSaveSession(message.sessionData);
          break;
        case "cancel":
          this.panel?.dispose();
          break;
        case "refreshFiles":
          this.refreshWebview();
          break;
      }
    });

    // Handle panel disposal
    this.panel.onDidDispose(() => {
      this.panel = undefined;
      this.selectedSession = undefined;
    });
  }

  private async selectSessionToUpdate(): Promise<Session | undefined> {
    try {
      // Check if workspace is open
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage("No workspace folder is open");
        return undefined;
      }

      const projectRoot = workspaceFolders[0].uri.fsPath;

      // Get available sessions for this project
      const listSessions = new ListSessions();
      const sessionsResult = await listSessions.execute();

      if (!sessionsResult.ok) {
        throw new Error("Failed to load sessions");
      }

      console.log(
        `SessionWebviewProvider: Found ${sessionsResult.value.length} total sessions`
      );
      console.log(
        `SessionWebviewProvider: Looking for sessions with projectRoot: "${projectRoot}"`
      );

      sessionsResult.value.forEach((session) => {
        console.log(
          `SessionWebviewProvider: Session "${session.name}" has projectRoot: "${session.projectRoot}"`
        );
      });

      const normalizedProjectRoot = projectRoot.toLowerCase();
      const sessions = sessionsResult.value.filter(
        (session) => session.projectRoot.toLowerCase() === normalizedProjectRoot
      );

      console.log(
        `SessionWebviewProvider: Found ${sessions.length} sessions for current project`
      );

      if (sessions.length === 0) {
        vscode.window.showInformationMessage(
          "No sessions found for this project. Save a session first."
        );
        return undefined;
      }

      // Show session picker
      const sessionItems = sessions.map((session) => {
        // Convert updatedAt to Date if it's a string
        const updatedAt =
          typeof session.updatedAt === "string"
            ? new Date(session.updatedAt)
            : session.updatedAt;
        const formattedDate =
          updatedAt instanceof Date
            ? updatedAt.toLocaleDateString()
            : "Unknown date";

        return {
          label: session.name,
          description: session.notes || "",
          detail: `Updated: ${formattedDate} | Tags: ${session.tags.join(
            ", "
          )}`,
          session,
        };
      });

      const selected = await vscode.window.showQuickPick(sessionItems, {
        placeHolder: "Select a session to update",
        matchOnDescription: true,
        matchOnDetail: true,
      });

      if (!selected || !selected.session) {
        console.log(
          "SessionWebviewProvider: No session selected or session is invalid"
        );
        return undefined;
      }

      // Validate the selected session has required properties
      if (!selected.session.id) {
        console.error("SessionWebviewProvider: Selected session is missing ID");
        vscode.window.showErrorMessage(
          "Selected session is invalid (missing ID). Please try again."
        );
        return undefined;
      }

      console.log(
        `SessionWebviewProvider: Selected session "${selected.session.name}" with ID "${selected.session.id}"`
      );
      return selected.session;
    } catch (error) {
      const extensionError =
        error instanceof ExtensionError
          ? error
          : ExtensionError.fromError(
              error instanceof Error ? error : new Error(String(error)),
              undefined,
              ErrorContext.SESSION_MANAGEMENT
            );

      this.errorHandler.handleError(
        extensionError,
        ErrorContext.SESSION_MANAGEMENT,
        true
      );
      return undefined;
    }
  }

    private async checkGitState(): Promise<void> {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        return;
      }

      const projectRoot = workspaceFolders[0].uri.fsPath;
      const { GitService } = await import('codestate-core');
      const gitService = new GitService(projectRoot);

      // Check if this is a Git repository
      const isGitRepo = await gitService.isGitRepository();
      if (!isGitRepo.ok || !isGitRepo.value) {
        return;
      }

      // Check if repository is dirty
      const isDirty = await gitService.getIsDirty();
      if (isDirty.ok && isDirty.value) {
        this.hasUncommittedChanges = true;
      }
    } catch (error) {
      console.warn('Failed to check Git state:', error);
    }
  }

  private async handleSaveSession(sessionData: any): Promise<void> {
    try {
      // Show warning if there are uncommitted changes
      if (this.hasUncommittedChanges) {
        const choice = await vscode.window.showWarningMessage(
          'You have uncommitted changes in your Git repository. You might consider committing or stashing before saving this session to ensure your work is preserved. Do you want to continue anyway?',
          'Yes, Continue',
          'Cancel'
        );
        
        if (choice !== 'Yes, Continue') {
          return; // User cancelled
        }
      }

      // Capture opened files as FileState objects
      const fileStates = this.captureFileStates();
      console.log(
        `SessionWebviewProvider: Captured ${fileStates.length} file states`
      );

      // Store the session data temporarily
      (globalThis as any).__tempSessionData = {
        mode: this.mode,
        sessionId: this.selectedSession?.id,
        name: sessionData.name,
        notes: sessionData.notes,
        tags: sessionData.tags
          ? sessionData.tags
              .split(",")
              .map((tag: string) => tag.trim())
              .filter((tag: string) => tag.length > 0)
          : [],
        files: fileStates,
      };

      // Close the panel first
      this.panel?.dispose();

      // Execute the appropriate command based on mode
      const command =
        this.mode === "create"
          ? "codestate.saveSession"
          : "codestate.updateSession";
      await vscode.commands.executeCommand(command);

      // Clean up
      delete (globalThis as any).__tempSessionData;
    } catch (error) {
      const extensionError =
        error instanceof ExtensionError
          ? error
          : ExtensionError.fromError(
              error instanceof Error ? error : new Error(String(error)),
              undefined,
              ErrorContext.SESSION_MANAGEMENT
            );

      this.errorHandler.handleError(
        extensionError,
        ErrorContext.SESSION_MANAGEMENT,
        true
      );

      vscode.window
        .showErrorMessage(
          `Failed to ${this.mode} session. Check the output panel for details.`,
          "Show Details",
          "Dismiss"
        )
        .then((selection) => {
          if (selection === "Show Details") {
            this.errorHandler.showOutputChannel();
          }
        });
    }
  }

  private refreshWebview(): void {
    if (this.panel) {
      this.panel.webview.html = this.getWebviewContent();
    }
  }

  private getOpenedFiles(): string[] {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return [];
    }

    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    const documentsToShow = new Set<string>();

    // Method 1: Get files from visible editors
    vscode.window.visibleTextEditors.forEach((editor) => {
      const document = editor.document;
      if (document.fileName.startsWith(workspaceRoot)) {
        const relativePath = document.fileName
          .replace(workspaceRoot, "")
          .replace(/^[\\\/]/, "");
        documentsToShow.add(relativePath);
      }
    });

    // Method 2: Get files from tab groups (backup method)
    try {
      const activeEditorGroups = vscode.window.tabGroups?.all || [];

      activeEditorGroups.forEach((group) => {
        group.tabs.forEach((tab) => {
          if (
            tab.input &&
            typeof tab.input === "object" &&
            "uri" in tab.input
          ) {
            const uri = (tab.input as any).uri;
            if (uri && uri.scheme === "file") {
              const fileName = uri.fsPath;
              if (fileName.startsWith(workspaceRoot)) {
                const relativePath = fileName
                  .replace(workspaceRoot, "")
                  .replace(/^[\\\/]/, "");
                documentsToShow.add(relativePath);
              }
            }
          }
        });
      });
    } catch (error) {
      console.log(`Debug: Error getting tabs: ${error}`);
    }

    // Convert set to array and sort
    const result = Array.from(documentsToShow).sort();

    return result;
  }

  private captureFileStates(): FileState[] {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return [];
    }

    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    const fileStates: FileState[] = [];

    // Get files from visible editors with full state
    vscode.window.visibleTextEditors.forEach((editor) => {
      const document = editor.document;
      if (document.fileName.startsWith(workspaceRoot)) {
        // Store full path for session data, but use relative path for display
        const fullPath = document.fileName;
        const relativePath = document.fileName
          .replace(workspaceRoot, "")
          .replace(/^[\\\/]/, "");
        const position = editor.selection.active;

        fileStates.push({
          path: fullPath, // Store full path for resume functionality
          cursor: {
            line: position.line,
            column: position.character,
          },
          scroll: {
            top: 0, // VS Code doesn't expose scroll position directly
            left: 0,
          },
          isActive: document === vscode.window.activeTextEditor?.document,
        });
      }
    });

    // Get files from tab groups (backup method) - add as inactive files
    try {
      const activeEditorGroups = vscode.window.tabGroups?.all || [];
      const processedPaths = new Set(fileStates.map((fs) => fs.path));

      activeEditorGroups.forEach((group) => {
        group.tabs.forEach((tab) => {
          if (
            tab.input &&
            typeof tab.input === "object" &&
            "uri" in tab.input
          ) {
            const uri = (tab.input as any).uri;
            if (uri && uri.scheme === "file") {
              const fileName = uri.fsPath;
              if (fileName.startsWith(workspaceRoot)) {
                const fullPath = fileName;

                // Only add if not already processed as a visible editor
                if (!processedPaths.has(fullPath)) {
                  fileStates.push({
                    path: fullPath, // Store full path for resume functionality
                    cursor: {
                      line: 0,
                      column: 0,
                    },
                    scroll: {
                      top: 0,
                      left: 0,
                    },
                    isActive: false,
                  });
                  processedPaths.add(fullPath);
                }
              }
            }
          }
        });
      });
    } catch (error) {
      console.log(`Debug: Error getting tabs: ${error}`);
    }

    return fileStates.sort((a, b) => a.path.localeCompare(b.path));
  }

  private categorizeFiles(): {
    removed: string[];
    new: string[];
    unchanged: string[];
  } {
    const currentFiles = this.getOpenedFiles(); // These are relative paths
    const workspaceRoot =
      vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || "";

    console.log("=== SESSION FILES DEBUG ===");
    console.log("this.selectedSession:", this.selectedSession);
    console.log("this.selectedSession?.files:", this.selectedSession?.files);
    console.log(
      "this.selectedSession?.files length:",
      this.selectedSession?.files?.length
    );
    if (this.selectedSession?.files) {
      this.selectedSession.files.forEach((file, index) => {
        console.log(`File ${index}:`, {
          path: file.path,
          cursor: file.cursor,
          isActive: file.isActive,
          scroll: file.scroll,
        });
      });
    }
    console.log("=== END SESSION FILES DEBUG ===");

    // Convert session files (full paths) to relative paths for comparison
    const originalFilePaths = (this.selectedSession?.files || []).map(
      (file) => {
        if (file.path.startsWith(workspaceRoot)) {
          // Normalize path separators for consistent comparison
          const relativePath = file.path
            .replace(workspaceRoot, "")
            .replace(/^[\\\/]/, "");
          return relativePath.replace(/[\\\/]/g, "/"); // Normalize to forward slashes
        }
        return file.path; // Fallback if path doesn't start with workspace root
      }
    );

    // Normalize current files to use forward slashes for consistent comparison
    const normalizedCurrentFiles = currentFiles.map((file) =>
      file.replace(/[\\\/]/g, "/")
    );

    console.log("Categorizing files:", {
      currentFiles: normalizedCurrentFiles,
      originalFilePaths,
      workspaceRoot,
    });

    const removed = originalFilePaths.filter(
      (file) => !normalizedCurrentFiles.includes(file)
    );
    const newFiles = normalizedCurrentFiles.filter(
      (file) => !originalFilePaths.includes(file)
    );
    const unchanged = normalizedCurrentFiles.filter((file) =>
      originalFilePaths.includes(file)
    );

    console.log("Categorized files:", { removed, new: newFiles, unchanged });

    return { removed, new: newFiles, unchanged };
  }

  private renderCategorizedFiles(categorizedFiles: {
    removed: string[];
    new: string[];
    unchanged: string[];
  }): string {
    console.log("renderCategorizedFiles called with:", categorizedFiles);

    const allFiles = [
      ...categorizedFiles.removed.map((file) => ({ file, status: "removed" })),
      ...categorizedFiles.new.map((file) => ({ file, status: "new" })),
      ...categorizedFiles.unchanged.map((file) => ({
        file,
        status: "unchanged",
      })),
    ];

    console.log("allFiles after mapping:", allFiles);

    if (allFiles.length === 0) {
      console.log("No files to render, returning no-files message");
      return '<div class="no-files">No files are currently open</div>';
    }

    const fileList = allFiles
      .sort((a, b) => a.file.localeCompare(b.file))
      .map(({ file, status }) => {
        const html = `<li class="file-${status}">${file}</li>`;
        console.log(`Generated HTML for ${file} (${status}):`, html);
        return html;
      })
      .join("");

    console.log("Generated fileList HTML:", fileList);
    return `<ul>${fileList}</ul>`;
  }

  private getWebviewContent(): string {
    // Get categorized files for display (only for update mode)
    const categorizedFiles =
      this.mode === "update" ? this.categorizeFiles() : null;

    // Pre-populate with existing session data (only for update mode)
    const sessionName =
      this.mode === "update" ? this.selectedSession?.name || "" : "";
    const sessionNotes =
      this.mode === "update" ? this.selectedSession?.notes || "" : "";
    const sessionTags =
      this.mode === "update"
        ? this.selectedSession?.tags?.join(", ") || ""
        : "";

    const title =
      this.mode === "create"
        ? "Create New Session"
        : `Update Session: ${sessionName}`;
    const subtitle =
      this.mode === "create"
        ? "Create a new development session."
        : "Update session details and capture current state.";
    const buttonText =
      this.mode === "create" ? "Create Session" : "Update Session";
    
    // Add warning message if there are uncommitted changes
    const warningMessage = this.hasUncommittedChanges 
      ? '<div class="warning-banner">You have uncommitted changes in your Git repository. Consider committing or stashing before saving this session.</div>'
      : '';

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            margin: 0;
            padding: 0;
            line-height: 1.6;
            height: 100vh;
            overflow: hidden;
          }

          .container {
            height: 100vh;
            display: flex;
            flex-direction: column;
            background-color: var(--vscode-panel-background);
          }

          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 20px 15px 20px;
            border-bottom: 1px solid var(--vscode-panel-border);
            background-color: var(--vscode-panel-background);
            flex-shrink: 0;
          }

          .header h1 {
            margin: 0;
            color: var(--vscode-editor-foreground);
            font-size: 1.5em;
          }

          .subtitle {
            margin-top: 4px;
            font-size: 0.85em;
            color: var(--vscode-descriptionForeground);
            font-style: italic;
          }

          .form-container {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            scrollbar-width: thin;
            scrollbar-color: var(--vscode-scrollbarSlider-background) transparent;
            display: flex;
            gap: 20px;
          }

          .form-container::-webkit-scrollbar {
            width: 8px;
          }

          .form-container::-webkit-scrollbar-track {
            background: transparent;
          }

          .form-container::-webkit-scrollbar-thumb {
            background-color: var(--vscode-scrollbarSlider-background);
            border-radius: 4px;
          }

          .form-container::-webkit-scrollbar-thumb:hover {
            background-color: var(--vscode-scrollbarSlider-hoverBackground);
          }

          .left-column {
            flex: 1;
            min-width: 0;
          }

          .right-column {
            width: 300px;
            flex-shrink: 0;
          }

          .section {
            margin-bottom: 25px;
            padding: 15px;
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
          }

          .section h2 {
            margin: 0 0 15px 0;
            color: var(--vscode-editor-foreground);
            font-size: 1.2em;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .form-group {
            margin-bottom: 15px;
          }

          .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
            color: var(--vscode-editor-foreground);
          }

          .form-group input[type="text"],
          .form-group textarea {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            font-family: inherit;
            font-size: inherit;
            box-sizing: border-box;
          }

          .form-group textarea {
            resize: vertical;
            min-height: 80px;
          }

                     .form-group input:focus,
           .form-group textarea:focus {
             outline: none;
             border-color: var(--vscode-focusBorder);
           }

           .form-group input[readonly] {
             background-color: var(--vscode-input-disabledBackground);
             color: var(--vscode-disabledForeground);
             cursor: not-allowed;
           }

          .buttons {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            padding: 20px;
            border-top: 1px solid var(--vscode-panel-border);
            background-color: var(--vscode-panel-background);
            flex-shrink: 0;
          }

          .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            font-family: inherit;
            font-size: inherit;
            cursor: pointer;
            transition: background-color 0.2s;
          }

          .btn-primary {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
          }

          .btn-primary:hover {
            background-color: var(--vscode-button-hoverBackground);
          }

          .btn-secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
          }

          .btn-secondary:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
          }

          .description {
            font-size: 0.9em;
            color: var(--vscode-descriptionForeground);
            margin-top: 5px;
          }

          .error {
            color: var(--vscode-errorForeground);
            font-size: 0.9em;
            margin-top: 5px;
            display: none;
          }

          .opened-files {
            margin-top: 10px;
          }

          .opened-files ul {
            list-style: none;
            padding: 0;
            margin: 0;
          }

          .opened-files li {
            padding: 4px 8px;
            margin: 2px 0;
            background-color: var(--vscode-list-hoverBackground);
            border-radius: 3px;
            font-family: var(--vscode-editor-font-family);
            font-size: 0.9em;
            color: var(--vscode-editor-foreground);
            word-break: break-all;
          }

          .opened-files li.file-removed {
            color: var(--vscode-errorForeground);
            text-decoration: line-through;
            opacity: 0.7;
          }

          .opened-files li.file-new {
            color: var(--vscode-textPreformat-foreground);
            font-weight: 500;
          }

          .opened-files li.file-unchanged {
            color: var(--vscode-editor-foreground);
          }

                     .no-files {
             color: var(--vscode-descriptionForeground);
             font-style: italic;
             text-align: center;
             padding: 20px;
           }

           .warning-banner {
             background-color: var(--vscode-inputValidation-warningBackground);
             color: var(--vscode-inputValidation-warningForeground);
             border: 1px solid var(--vscode-inputValidation-warningBorder);
             padding: 12px 20px;
             margin: 0;
             font-size: 0.9em;
             display: flex;
             align-items: center;
             gap: 8px;
           }

           .warning-banner::before {
             content: "⚠️";
             font-size: 1.1em;
           }
        </style>
      </head>
      <body>
                 <div class="container">
           ${warningMessage}
           <div class="header">
             <div>
               <h1>📝 ${title}</h1>
               <div class="subtitle">${subtitle}</div>
             </div>
           </div>

          <div class="form-container">
            <div class="left-column">
              <form id="sessionForm">
                <!-- Session Details Section -->
                <div class="section">
                  <h2>🎯 Session Details</h2>
                  
                  <div class="form-group">
                    <label for="name">Session Name *</label>
                    <input type="text" id="name" name="name" required placeholder="e.g., Feature Implementation, Bug Fix, Setup" value="${sessionName}" ${
      this.mode === "update" ? "readonly" : ""
    }>
                    <div class="description">${
                      this.mode === "update"
                        ? "Session name cannot be changed during update"
                        : "A descriptive name for your session"
                    }</div>
                    <div class="error" id="nameError">Session name is required</div>
                  </div>

                  <div class="form-group">
                    <label for="notes">Notes</label>
                    <textarea id="notes" name="notes" placeholder="Optional notes about this session...">${sessionNotes}</textarea>
                    <div class="description">Additional context or description for this session</div>
                  </div>

                  <div class="form-group">
                    <label for="tags">Tags</label>
                    <input type="text" id="tags" name="tags" placeholder="feature, bugfix, setup (comma-separated)" value="${sessionTags}">
                    <div class="description">Tags to help organize and find your sessions</div>
                  </div>
                </div>
              </form>
            </div>

            <div class="right-column">
              <div class="section">
                <h2>📂 Opened Files</h2>
                <div class="opened-files">
                  ${
                    this.mode === "update"
                      ? this.renderCategorizedFiles(categorizedFiles!)
                      : this.renderSimpleFileList()
                  }
                </div>
                <button type="button" class="btn btn-secondary" onclick="refreshFiles()" style="margin-top: 10px; width: 100%;">🔄 Refresh File List</button>
              </div>
            </div>
          </div>

          <div class="buttons">
            <button type="button" class="btn btn-secondary" onclick="cancel()">Cancel</button>
            <button type="submit" class="btn btn-primary" onclick="saveSession()">${buttonText}</button>
          </div>
        </div>

        <script>
          const vscode = acquireVsCodeApi();

          // Handle form submission
          document.getElementById('sessionForm').addEventListener('submit', function(e) {
            e.preventDefault();
            saveSession();
          });

                     function saveSession() {
             const name = document.getElementById('name').value.trim();
             const notes = document.getElementById('notes').value.trim();
             const tags = document.getElementById('tags').value.trim();

             // Validate required fields (skip name validation in update mode since it's readonly)
             const isUpdateMode = document.getElementById('name').readOnly;
             if (!isUpdateMode && !name) {
               document.getElementById('nameError').style.display = 'block';
               document.getElementById('name').focus();
               return;
             }

             document.getElementById('nameError').style.display = 'none';

            const sessionData = {
              name: name,
              notes: notes || '',
              tags: tags || ''
            };

            vscode.postMessage({
              command: 'saveSession',
              sessionData: sessionData
            });
          }

          function cancel() {
            vscode.postMessage({
              command: 'cancel'
            });
          }

          function refreshFiles() {
            vscode.postMessage({
              command: 'refreshFiles'
            });
          }

          // Focus on name field when page loads
          document.addEventListener('DOMContentLoaded', function() {
            document.getElementById('name').focus();
          });
        </script>
      </body>
      </html>
    `;
  }

  private renderSimpleFileList(): string {
    const openedFiles = this.getOpenedFiles();

    if (openedFiles.length === 0) {
      return '<div class="no-files">No files are currently open</div>';
    }

    const fileList = openedFiles.map((file) => `<li>${file}</li>`).join("");

    return `<ul>${fileList}</ul>`;
  }
}
