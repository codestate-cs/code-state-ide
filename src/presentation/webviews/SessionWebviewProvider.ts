import { FileState, ListSessions, Session, ListTerminalCollections, GetScripts } from "@codestate/core";
import * as vscode from "vscode";
import { ErrorHandler } from "../../shared/errors/ErrorHandler";
import {
  ErrorContext,
  ExtensionError,
} from "../../shared/errors/ExtensionError";
import { DataCacheService } from "../../infrastructure/services/DataCacheService";

export class SessionWebviewProvider {
  private static readonly viewType = "codestate.session";
  private panel: vscode.WebviewPanel | undefined;
  private errorHandler: ErrorHandler;
  private selectedSession: Session | undefined;
  private mode: "create" | "update" | "resume" | "edit" = "create";
  private hasUncommittedChanges: boolean = false;
  private currentStep: number = 1;
  private formData: {
    name: string;
    notes: string;
    tags: string[];
    files: FileState[];
    terminalCollections: string[];
    scripts: string[];
  } = {
    name: "",
    notes: "",
    tags: [],
    files: [],
    terminalCollections: [],
    scripts: []
  };

  constructor() {
    this.errorHandler = ErrorHandler.getInstance();
  }

  private resetState(): void {
    console.log("SessionWebviewProvider: Resetting state");
    this.panel = undefined;
    this.currentStep = 1;
    this.formData = {
      name: "",
      notes: "",
      tags: [],
      files: [],
      terminalCollections: [],
      scripts: []
    };
  }

  async show(mode: "create" | "update" | "resume" | "edit" = "create", session?: Session): Promise<void> {
    // Reset state for new session
    this.resetState();
    this.mode = mode;

    if (mode === "update" || mode === "resume" || mode === "edit") {
      let targetSession: Session | undefined;
      
      if (session) {
        // Use the provided session
        targetSession = session;
        console.log(
          `SessionWebviewProvider: Using provided session "${targetSession.name}" with ID "${targetSession.id}"`
        );
      } else if (mode === "update") {
        // Only for update mode, show session selection if no session provided
        targetSession = await this.selectSessionToUpdate();
        if (!targetSession) {
        console.log("SessionWebviewProvider: No session selected, cancelling");
        return; // User cancelled
        }
      }

      if (targetSession) {
        this.selectedSession = targetSession;
        
        // Pre-populate form data for update/resume/edit mode
        this.formData = {
          name: targetSession.name,
          notes: targetSession.notes || "",
          tags: targetSession.tags || [],
          files: targetSession.files || [],
          terminalCollections: this.convertToObjectArray(targetSession.terminalCollections || []),
          scripts: this.convertToObjectArray(targetSession.scripts || [])
        };
        
        // For resume mode, start at step 1 to allow modifications
        // For edit mode, start at step 1 to allow modifications
        // For update mode, start at step 1 to allow modifications
        this.currentStep = 1;
      }
    }

    // Check Git state for uncommitted changes
    await this.checkGitState();

    // Create and show panel with warning if needed
    let baseTitle: string;
    switch (mode) {
      case "create":
        baseTitle = "Create New Session";
        break;
      case "resume":
        baseTitle = `Resume Session: ${this.selectedSession?.name}`;
        break;
      case "edit":
        baseTitle = `Edit Session: ${this.selectedSession?.name}`;
        break;
      default:
        baseTitle = `Update Session: ${this.selectedSession?.name}`;
    }
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
        case "nextStep":
          this.currentStep = Math.min(this.currentStep + 1, 5);
          break;
        case "prevStep":
          this.currentStep = Math.max(this.currentStep - 1, 1);
          break;
        case "goToStep":
          this.currentStep = message.step;
          break;
        case "updateFormData":
          this.formData = { ...this.formData, ...message.data };
          break;
        case "getTerminalCollections":
          const collections = await this.getTerminalCollections();
          this.panel?.webview.postMessage({
            command: "terminalCollectionsData",
            data: collections
          });
          break;
        case "getScripts":
          const scripts = await this.getScripts();
          this.panel?.webview.postMessage({
            command: "scriptsData",
            data: scripts
          });
          break;
      }
    });

    // Handle panel disposal
    this.panel.onDidDispose(() => {
      this.resetState();
    });
  }

  private async selectSessionToUpdate(): Promise<Session | undefined> {
    try {
      const { ListSessions } = await import('@codestate/core');
      const listSessions = new ListSessions();
      const sessionsResult = await listSessions.execute({});

      if (!sessionsResult.ok) {
        throw new Error("Failed to load sessions");
      }

      const sessions = sessionsResult.value;
      if (sessions.length === 0) {
        vscode.window.showInformationMessage("No sessions found to update.");
        return undefined;
      }

      // Show session picker
      const sessionNames = sessions.map(s => s.name);
      const selectedName = await vscode.window.showQuickPick(sessionNames, {
        placeHolder: "Select a session to update",
        ignoreFocusOut: true
      });

      if (!selectedName) {
        return undefined; // User cancelled
      }

      const selectedSession = sessions.find(s => s.name === selectedName);
      if (!selectedSession) {
        throw new Error("Selected session not found");
      }

      return selectedSession;
    } catch (error) {
      const extensionError = ExtensionError.fromError(
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
      const { GitService } = await import('@codestate/core');
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
    console.log("SessionWebviewProvider: handleSaveSession called");
    console.log("SessionWebviewProvider: mode:", this.mode);
    console.log("SessionWebviewProvider: selectedSession:", this.selectedSession);
    
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

      // Prepare session data with new fields
      const sessionDataToPass = {
        name: sessionData.name,
        notes: sessionData.notes,
        tags: sessionData.tags
          ? sessionData.tags
              .split(",")
              .map((tag: string) => tag.trim())
              .filter((tag: string) => tag.length > 0)
          : [],
        files: fileStates,
        terminalCommands: [], // Pass as empty array by default
        terminalCollections: sessionData.terminalCollections || [],
        scripts: sessionData.scripts || []
      };

      console.log("SessionWebviewProvider: Session data prepared:", sessionDataToPass);

      // Execute the appropriate command based on mode with session data
      if (this.mode === "create") {
        await vscode.commands.executeCommand("codestate.saveSession", "create", undefined, sessionDataToPass);
      } else if (this.mode === "resume" || this.mode === "edit") {
        // For resume and edit modes, we're essentially updating the session
        console.log(`SessionWebviewProvider: ${this.mode} mode - selectedSession:`, this.selectedSession);
        if (!this.selectedSession) {
          throw new Error(`No session selected for ${this.mode}. Please select a session first.`);
        }
        await vscode.commands.executeCommand("codestate.updateSession", "update", this.selectedSession, sessionDataToPass);
      } else {
        // Update mode
        console.log("SessionWebviewProvider: Update mode - selectedSession:", this.selectedSession);
        if (!this.selectedSession) {
          throw new Error("No session selected for update. Please select a session first.");
        }
        await vscode.commands.executeCommand("codestate.updateSession", "update", this.selectedSession, sessionDataToPass);
      }

      // The SessionCommand will handle cache clearing and refresh
      // No need to duplicate the operations here

      // Close the panel after the command has been executed
      this.panel?.dispose();
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

      const actionText = this.mode === "create" ? "create" : 
                        this.mode === "resume" ? "resume" : 
                        this.mode === "edit" ? "edit" : "update";

      vscode.window
        .showErrorMessage(
          `Failed to ${actionText} session. Check the output panel for details.`,
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
          position: fileStates.length, // Add position based on order
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
                    position: fileStates.length, // Add position based on order
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

  private async getTerminalCollections(): Promise<any[]> {
    try {
      const { ListTerminalCollections } = await import('@codestate/core');
      const listCollections = new ListTerminalCollections();
      const result = await listCollections.execute();
      
      if (result.ok) {
        return result.value.map(collection => ({
          id: collection.id,
          name: collection.name,
          description: `Runs on: ${collection.lifecycle.join(', ')}`,
          scriptCount: collection.scripts.length
        }));
      }
      return [];
    } catch (error) {
      console.warn('Failed to get terminal collections:', error);
      return [];
    }
  }

  private async getScripts(): Promise<any[]> {
    try {
      const { GetScripts } = await import('@codestate/core');
      const getScripts = new GetScripts();
      const result = await getScripts.execute();
      
      if (result.ok) {
        return result.value.map(script => ({
          id: script.id,
          name: script.name,
          description: script.script || 'No description available',
          priority: 1
        }));
      }
      return [];
    } catch (error) {
      console.warn('Failed to get scripts:', error);
      return [];
    }
  }

  private getSaveButtonText(): string {
    switch (this.mode) {
      case "create":
        return "Create Session";
      case "resume":
        return "Resume Session";
      case "edit":
        return "Save Changes";
      default:
        return "Update Session";
    }
  }

  private convertToObjectArray(items: string[] | any[]): any[] {
    // Convert array of strings (IDs) to array of objects with id and name
    if (items.length === 0) return [];
    
    if (typeof items[0] === 'string') {
      // Convert IDs to objects
      return items.map(id => ({ id, name: id }));
    }
    
    // Already in object format, return as is
    return items;
  }

  private getWebviewContent(): string {
    let title: string;
    let subtitle: string;
    
    switch (this.mode) {
      case "create":
        title = "Create New Session";
        subtitle = "Create a new development session.";
        break;
      case "resume":
        title = `Resume Session: ${this.selectedSession?.name}`;
        subtitle = "Resume and modify an existing session.";
        break;
      case "edit":
        title = `Edit Session: ${this.selectedSession?.name}`;
        subtitle = "Edit session details and capture current state.";
        break;
      default:
        title = `Update Session: ${this.selectedSession?.name}`;
        subtitle = "Update session details and capture current state.";
    }
    
    // Add warning message if there are uncommitted changes
    const warningMessage = this.hasUncommittedChanges 
      ? '<div class="warning-banner">⚠️ You have uncommitted changes in your Git repository. Consider committing or stashing before saving this session.</div>'
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

          .progress-bar {
            display: flex;
            justify-content: space-between;
            padding: 0 20px 20px 20px;
            background-color: var(--vscode-panel-background);
            border-bottom: 1px solid var(--vscode-panel-border);
          }

          .step {
            display: flex;
            flex-direction: column;
            align-items: center;
            flex: 1;
            max-width: 120px;
          }

          .step-number {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            margin-bottom: 8px;
            cursor: pointer;
            transition: all 0.2s;
          }

          .step-number.active {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
          }

          .step-number.completed {
            background-color: var(--vscode-progressBar-background);
            color: var(--vscode-progressBar-foreground);
          }

          .step-number.inactive {
            background-color: var(--vscode-input-background);
            color: var(--vscode-descriptionForeground);
            border: 2px solid var(--vscode-panel-border);
          }

          .step-label {
            font-size: 0.8em;
            text-align: center;
            color: var(--vscode-descriptionForeground);
            line-height: 1.2;
          }

          .step-label.active {
            color: var(--vscode-editor-foreground);
            font-weight: 500;
          }

          .form-container {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            scrollbar-width: thin;
            scrollbar-color: var(--vscode-scrollbarSlider-background) transparent;
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

          .step-content {
            max-width: 800px;
            margin: 0 auto;
          }

          .step-panel {
            animation: fadeIn 0.3s ease-in-out;
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .section {
            margin-bottom: 25px;
            padding: 20px;
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 6px;
          }

          .section h2 {
            margin: 0 0 20px 0;
            color: var(--vscode-editor-foreground);
            font-size: 1.3em;
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .form-group {
            margin-bottom: 20px;
          }

          .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: var(--vscode-editor-foreground);
          }

          .form-group input[type="text"],
          .form-group textarea {
            width: 100%;
            padding: 10px 12px;
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
            min-height: 100px;
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

          .description {
            font-size: 0.9em;
            color: var(--vscode-descriptionForeground);
            margin-top: 6px;
            font-style: italic;
          }

          .error {
            color: var(--vscode-errorForeground);
            font-size: 0.9em;
            margin-top: 6px;
            display: none;
          }

          .checkbox-group {
            margin-bottom: 15px;
          }

          .checkbox-item {
            display: flex;
            align-items: flex-start;
            padding: 12px;
            margin-bottom: 8px;
            background-color: var(--vscode-list-hoverBackground);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s;
          }

          .checkbox-item:hover {
            background-color: var(--vscode-list-activeSelectionBackground);
            border-color: var(--vscode-focusBorder);
          }

          .checkbox-item.selected {
            background-color: var(--vscode-list-activeSelectionBackground);
            border-color: var(--vscode-focusBorder);
          }

          .checkbox-item input[type="checkbox"] {
            margin-right: 12px;
            margin-top: 2px;
          }

          .checkbox-item-content {
            flex: 1;
          }

          .checkbox-item-name {
            font-weight: 500;
            color: var(--vscode-editor-foreground);
            margin-bottom: 4px;
          }

          .checkbox-item-description {
            font-size: 0.9em;
            color: var(--vscode-descriptionForeground);
            line-height: 1.4;
          }

          .checkbox-item-meta {
            font-size: 0.8em;
            color: var(--vscode-descriptionForeground);
            margin-top: 4px;
          }

          .search-box {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            font-family: inherit;
            font-size: inherit;
            margin-bottom: 15px;
            box-sizing: border-box;
          }

          .search-box:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
           }

          .buttons {
            display: flex;
            justify-content: space-between;
            padding: 20px;
            border-top: 1px solid var(--vscode-panel-border);
            background-color: var(--vscode-panel-background);
            flex-shrink: 0;
          }

          .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            font-family: inherit;
            font-size: inherit;
            cursor: pointer;
            transition: all 0.2s;
            font-weight: 500;
          }

          .btn-primary {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
          }

          .btn-primary:hover {
            background-color: var(--vscode-button-hoverBackground);
          }

          .btn-primary:disabled {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            cursor: not-allowed;
          }

          .btn-secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: 1px solid var(--vscode-button-secondaryBorder);
          }

          .btn-secondary:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
          }

          .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
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

          .summary-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid var(--vscode-panel-border);
          }

          .summary-item:last-child {
            border-bottom: none;
          }

          .summary-label {
            font-weight: 500;
            color: var(--vscode-editor-foreground);
          }

          .summary-value {
            color: var(--vscode-descriptionForeground);
            text-align: right;
            max-width: 60%;
          }

          .summary-section {
            margin-bottom: 20px;
          }

          .summary-section h3 {
            margin: 0 0 10px 0;
            color: var(--vscode-editor-foreground);
            font-size: 1.1em;
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 5px;
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

          <div class="progress-bar">
            <div class="step" onclick="goToStep(1)">
              <div class="step-number ${this.currentStep >= 1 ? (this.currentStep === 1 ? 'active' : 'completed') : 'inactive'}">1</div>
              <div class="step-label ${this.currentStep === 1 ? 'active' : ''}">Basic Info</div>
            </div>
            <div class="step" onclick="goToStep(2)">
              <div class="step-number ${this.currentStep >= 2 ? (this.currentStep === 2 ? 'active' : 'completed') : 'inactive'}">2</div>
              <div class="step-label ${this.currentStep === 2 ? 'active' : ''}">Files</div>
            </div>
            <div class="step" onclick="goToStep(3)">
              <div class="step-number ${this.currentStep >= 3 ? (this.currentStep === 3 ? 'active' : 'completed') : 'inactive'}">3</div>
              <div class="step-label ${this.currentStep === 3 ? 'active' : ''}">Terminals</div>
            </div>
            <div class="step" onclick="goToStep(4)">
              <div class="step-number ${this.currentStep >= 4 ? (this.currentStep === 4 ? 'active' : 'completed') : 'inactive'}">4</div>
              <div class="step-label ${this.currentStep === 4 ? 'active' : ''}">Scripts</div>
            </div>
            <div class="step" onclick="goToStep(5)">
              <div class="step-number ${this.currentStep >= 5 ? (this.currentStep === 5 ? 'active' : 'completed') : 'inactive'}">5</div>
              <div class="step-label ${this.currentStep === 5 ? 'active' : ''}">Review</div>
             </div>
           </div>

          <div class="form-container">
            <div class="step-content">
              <!-- Step 1: Basic Session Information -->
              <div class="step-panel" id="step1" style="display: ${this.currentStep === 1 ? 'block' : 'none'}">
                ${this.getStep1Content()}
              </div>
              
              <!-- Step 2: File State Capture -->
              <div class="step-panel" id="step2" style="display: ${this.currentStep === 2 ? 'block' : 'none'}">
                ${this.getStep2Content()}
                  </div>

              <!-- Step 3: Terminal Collections -->
              <div class="step-panel" id="step3" style="display: ${this.currentStep === 3 ? 'block' : 'none'}">
                ${this.getStep3Content()}
                  </div>

              <!-- Step 4: Scripts Selection -->
              <div class="step-panel" id="step4" style="display: ${this.currentStep === 4 ? 'block' : 'none'}">
                ${this.getStep4Content()}
            </div>

              <!-- Step 5: Review & Confirm -->
              <div class="step-panel" id="step5" style="display: ${this.currentStep === 5 ? 'block' : 'none'}">
                ${this.getStep5Content()}
              </div>
            </div>
          </div>

          <div class="buttons">
            ${this.currentStep > 1 ? '<button type="button" class="btn btn-secondary" onclick="prevStep()">← Previous Step</button>' : '<div></div>'}
            ${this.currentStep < 5 ? '<button type="button" class="btn btn-primary" onclick="nextStep()">Next Step →</button>' : '<button type="button" class="btn btn-primary" onclick="saveSession()">' + this.getSaveButtonText() + '</button>'}
          </div>
        </div>

        <script>
          const vscode = acquireVsCodeApi();
          let formData = ${JSON.stringify(this.formData)};
          let terminalCollections = [];
          let scripts = [];
          
          // Ensure formData has the correct structure for storing both IDs and names
          if (!formData.terminalCollections) {
            formData.terminalCollections = [];
          }
          if (!formData.scripts) {
            formData.scripts = [];
          }
          
          // Migrate old data structure (if it was just IDs) to new structure (objects with id and name)
          function migrateFormDataStructure() {
            // Check if terminalCollections are just IDs and need migration
            if (formData.terminalCollections.length > 0 && typeof formData.terminalCollections[0] === 'string') {
              console.log('Migrating terminalCollections from IDs to objects');
              formData.terminalCollections = formData.terminalCollections.map(id => ({ id, name: id }));
            }
            
            // Check if scripts are just IDs and need migration
            if (formData.scripts.length > 0 && typeof formData.scripts[0] === 'string') {
              console.log('Migrating scripts from IDs to objects');
              formData.scripts = formData.scripts.map(id => ({ id, name: id }));
            }
          }
          
          // Run migration if needed
          migrateFormDataStructure();

          // Track current step in frontend
          let currentStep = ${this.currentStep};

          // Step navigation
          function nextStep() {
            console.log('nextStep called, currentStep:', currentStep);
            console.log('validateCurrentStep result:', validateCurrentStep());
            
            if (validateCurrentStep()) {
              if (currentStep < 5) {
                currentStep++;
                console.log('Moving to step:', currentStep);
                showStep(currentStep);
                vscode.postMessage({ command: 'nextStep' });
              } else {
                console.log('Already at last step');
              }
            } else {
              console.log('Validation failed, staying on step:', currentStep);
            }
          }

          function prevStep() {
            if (currentStep > 1) {
              currentStep--;
              showStep(currentStep);
              vscode.postMessage({ command: 'prevStep' });
            }
          }

          function goToStep(step) {
            // Allow navigation to any step that's been reached or is the current step
            if (step <= currentStep) {
              currentStep = step;
              showStep(step);
              vscode.postMessage({ command: 'goToStep', step: step });
            }
          }

          function showStep(step) {
            console.log('showStep called with step:', step);
            
            // Hide all steps
            for (let i = 1; i <= 5; i++) {
              const stepPanel = document.getElementById(\`step\${i}\`);
              if (stepPanel) {
                stepPanel.style.display = 'none';
              }
            }
            
            // Show the target step
            const targetStep = document.getElementById(\`step\${step}\`);
            if (targetStep) {
              targetStep.style.display = 'block';
              console.log('Step', step, 'is now visible');
            } else {
              console.error('Could not find step panel for step:', step);
            }
            
            // Update progress bar
            updateProgressBar(step);
            
            // Load step-specific data if needed
            loadStepData(step);
            
            // Sync form data to visible fields
            syncFormDataToFields();
            
            // Special handling for review step
            if (step === 5) {
              console.log('Updating review step with current form data');
              updateReviewStep();
            }
          }

          function syncFormDataToFields() {
            console.log('syncFormDataToFields called, syncing formData to visible fields');
            console.log('Current formData:', formData);
            
            // Sync name field
            const nameField = document.getElementById('name');
            if (nameField && formData.name) {
              nameField.value = formData.name;
              console.log('Synced name field with:', formData.name);
            }
            
            // Sync notes field
            const notesField = document.getElementById('notes');
            if (notesField && formData.notes) {
              notesField.value = formData.notes;
              console.log('Synced notes field with:', formData.notes);
            }
            
            // Sync tags field
            const tagsField = document.getElementById('tags');
            if (tagsField && formData.tags && formData.tags.length > 0) {
              tagsField.value = formData.tags.join(', ');
              console.log('Synced tags field with:', formData.tags.join(', '));
            }
          }

          function updateProgressBar(activeStep) {
            // Update step numbers
            for (let i = 1; i <= 5; i++) {
              const stepNumber = document.querySelector(\`.step:nth-child(\${i}) .step-number\`);
              const stepLabel = document.querySelector(\`.step:nth-child(\${i}) .step-label\`);
              
              if (stepNumber && stepLabel) {
                if (i < activeStep) {
                  stepNumber.className = 'step-number completed';
                  stepLabel.className = 'step-label';
                } else if (i === activeStep) {
                  stepNumber.className = 'step-number active';
                  stepLabel.className = 'step-label active';
                } else {
                  stepNumber.className = 'step-number inactive';
                  stepLabel.className = 'step-label';
                }
              }
            }
            
            // Update buttons
            updateButtons(activeStep);
          }

          function updateButtons(activeStep) {
            const buttonsContainer = document.querySelector('.buttons');
            if (buttonsContainer) {
              const prevButton = buttonsContainer.querySelector('.btn-secondary');
              const nextButton = buttonsContainer.querySelector('.btn-primary');
              
              if (prevButton) {
                prevButton.style.display = activeStep > 1 ? 'block' : 'none';
              }
              
              if (nextButton) {
                if (activeStep < 5) {
                  nextButton.textContent = 'Next Step →';
                  nextButton.onclick = nextStep;
                } else {
                  nextButton.textContent = '${this.getSaveButtonText()}';
                  nextButton.onclick = saveSession;
                }
              }
            }
          }

          function validateCurrentStep() {
            console.log('validateCurrentStep called for step:', currentStep);
            
            if (currentStep === 1) {
              const name = document.getElementById('name')?.value?.trim();
              console.log('Validating name field:', name);
              if (!name) {
                console.log('Name validation failed');
               document.getElementById('nameError').style.display = 'block';
               document.getElementById('name').focus();
                return false;
             }
             document.getElementById('nameError').style.display = 'none';
              console.log('Name validation passed');
            }
            
            // For steps 2, 3, and 4, no validation is required
            // Users can proceed freely through these steps
            if (currentStep >= 2 && currentStep <= 4) {
              console.log('No validation required for step:', currentStep);
              return true;
            }
            
            console.log('Validation passed for step:', currentStep);
            return true;
          }

          function updateFormData() {
            const name = document.getElementById('name')?.value?.trim() || '';
            const notes = document.getElementById('notes')?.value?.trim() || '';
            const tags = document.getElementById('tags')?.value?.trim() || '';
            
            formData.name = name;
            formData.notes = notes;
            formData.tags = tags ? tags.split(',').map(t => t.trim()).filter(t => t.length > 0) : [];
            
            // Update the form data in the extension
            vscode.postMessage({ 
              command: 'updateFormData', 
              data: formData 
            });
            
            // Update the review step if we're on it
            if (currentStep === 5) {
              updateReviewStep();
            }
          }

          function updateReviewStep() {
            console.log('updateReviewStep called, current formData:', formData);
            
            // Find the review content container within step5
            const reviewContainer = document.getElementById('reviewContent');
            if (reviewContainer) {
              // Generate review content with current form data
              const fileStates = []; // This would need to be captured from the extension
              const categorizedFiles = null; // This would need to be captured from the extension
              
              const reviewContent = generateReviewContent(formData, fileStates, categorizedFiles);
              reviewContainer.innerHTML = reviewContent;
              console.log('Review step updated with content');
            } else {
              console.error('Could not find review content container');
            }
          }

          function generateReviewContent(formData, fileStates, categorizedFiles) {
            console.log('generateReviewContent called with formData:', formData);
            
            // Ensure we have safe access to formData properties
            const safeFormData = {
              name: formData.name || 'Not specified',
              notes: formData.notes || 'None',
              tags: Array.isArray(formData.tags) ? formData.tags : [],
              terminalCollections: Array.isArray(formData.terminalCollections) ? formData.terminalCollections : [],
              scripts: Array.isArray(formData.scripts) ? formData.scripts : []
            };
            
            console.log('Safe form data for review:', safeFormData);
            
            return \`
              <div class="summary-section">
                <h3>📋 Basic Information</h3>
                <div class="summary-item">
                  <span class="summary-label">Name:</span>
                  <span class="summary-value">\${safeFormData.name}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Notes:</span>
                  <span class="summary-value">\${safeFormData.notes}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Tags:</span>
                  <span class="summary-value">\${safeFormData.tags.length > 0 ? safeFormData.tags.join(', ') : 'None'}</span>
                </div>
              </div>

              <div class="summary-section">
                <h3>📂 File State</h3>
                <div class="summary-item">
                  <span class="summary-label">Open Files:</span>
                  <span class="summary-value">\${fileStates ? fileStates.length : 0} files</span>
                </div>
              </div>

              <div class="summary-section">
                <h3>🚀 Terminal Collections</h3>
                <div class="summary-item">
                  <span class="summary-label">Selected:</span>
                  <span class="summary-value">\${safeFormData.terminalCollections.length} collections</span>
                </div>
                \${safeFormData.terminalCollections.length > 0 ? \`
                <div class="summary-item">
                  <span class="summary-label">Collections:</span>
                  <span class="summary-value">\${safeFormData.terminalCollections.map(c => c.name).join(', ')}</span>
                </div>
                \` : ''}
              </div>

              <div class="summary-section">
                <h3>📜 Scripts</h3>
                <div class="summary-item">
                  <span class="summary-label">Selected:</span>
                  <span class="summary-value">\${safeFormData.scripts.length} scripts</span>
                </div>
                \${safeFormData.scripts.length > 0 ? \`
                <div class="summary-item">
                  <span class="summary-label">Scripts:</span>
                  <span class="summary-value">\${safeFormData.scripts.map(s => s.name).join(', ')}</span>
                </div>
                \` : ''}
              </div>
            \`;
          }

          function saveSession() {
            updateFormData();
            
            // Extract just the IDs for the API call (since the API expects IDs)
            const terminalCollectionIds = formData.terminalCollections.map(c => c.id);
            const scriptIds = formData.scripts.map(s => s.id);

            const sessionData = {
              name: formData.name,
              notes: formData.notes,
              tags: formData.tags.join(', '),
              terminalCollections: terminalCollectionIds,
              scripts: scriptIds
            };

            console.log('Saving session with data:', sessionData);
            console.log('Original formData.terminalCollections:', formData.terminalCollections);
            console.log('Original formData.scripts:', formData.scripts);

            vscode.postMessage({
              command: 'saveSession',
              sessionData: sessionData
            });
          }

          function cancel() {
            vscode.postMessage({ command: 'cancel' });
          }

          function refreshFiles() {
            vscode.postMessage({ command: 'refreshFiles' });
          }

          function toggleTerminalCollection(id) {
            console.log('toggleTerminalCollection called with id:', id);
            
            // Find the collection object to get the name
            const collection = terminalCollections.find(c => c.id === id);
            if (!collection) {
              console.error('Collection not found for id:', id);
              return;
            }
            
            // Check if already selected
            const existingIndex = formData.terminalCollections.findIndex(c => c.id === id);
            if (existingIndex > -1) {
              // Remove from selection
              formData.terminalCollections.splice(existingIndex, 1);
              console.log('Removed collection:', collection.name);
            } else {
              // Add to selection with both id and name
              formData.terminalCollections.push({
                id: id,
                name: collection.name
              });
              console.log('Added collection:', collection.name);
            }
            
            console.log('Updated terminalCollections:', formData.terminalCollections);
            updateFormData();
            renderTerminalCollections();
          }

          function toggleScript(id) {
            console.log('toggleScript called with id:', id);
            
            // Find the script object to get the name
            const script = scripts.find(s => s.id === id);
            if (!script) {
              console.error('Script not found for id:', id);
              return;
            }
            
            // Check if already selected
            const existingIndex = formData.scripts.findIndex(s => s.id === id);
            if (existingIndex > -1) {
              // Remove from selection
              formData.scripts.splice(existingIndex, 1);
              console.log('Removed script:', script.name);
            } else {
              // Add to selection with both id and name
              formData.scripts.push({
                id: id,
                name: script.name
              });
              console.log('Added script:', script.name);
            }
            
            console.log('Updated scripts:', formData.scripts);
            updateFormData();
            renderScripts();
          }

          function renderTerminalCollections() {
            const container = document.getElementById('terminalCollectionsContainer');
            if (!container) return;
            
            container.innerHTML = terminalCollections.map(collection => {
              // Check if this collection is selected (using the new object structure)
              const isSelected = formData.terminalCollections.some(c => c.id === collection.id);
              
              return \`
                <div class="checkbox-item \${isSelected ? 'selected' : ''}" onclick="toggleTerminalCollection('\${collection.id}')">
                  <input type="checkbox" \${isSelected ? 'checked' : ''} readonly>
                  <div class="checkbox-item-content">
                    <div class="checkbox-item-name">\${collection.name}</div>
                    <div class="checkbox-item-description">\${collection.description}</div>
                    <div class="checkbox-item-meta">\${collection.scriptCount} scripts</div>
                  </div>
                </div>
              \`;
            }).join('');
          }

          function renderScripts() {
            const container = document.getElementById('scriptsContainer');
            if (!container) return;
            
            container.innerHTML = scripts.map(script => {
              // Check if this script is selected (using the new object structure)
              const isSelected = formData.scripts.some(s => s.id === script.id);
              
              return \`
                <div class="checkbox-item \${isSelected ? 'selected' : ''}" onclick="toggleScript('\${script.id}')">
                  <input type="checkbox" \${isSelected ? 'checked' : ''} readonly>
                  <div class="checkbox-item-content">
                    <div class="checkbox-item-name">\${script.name}</div>
                    <div class="checkbox-item-description">\${script.description}</div>
                  </div>
                </div>
              \`;
            }).join('');
          }

          // Load data when step changes
          function loadStepData(step) {
            if (step === 3 && terminalCollections.length === 0) {
              vscode.postMessage({ command: 'getTerminalCollections' });
            } else if (step === 4 && scripts.length === 0) {
              vscode.postMessage({ command: 'getScripts' });
            }
          }

          // Handle messages from extension
          window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
              case 'terminalCollectionsData':
                terminalCollections = message.data;
                console.log('Received terminal collections data:', terminalCollections);
                updateTerminalCollectionNames();
                renderTerminalCollections();
                break;
              case 'scriptsData':
                scripts = message.data;
                console.log('Received scripts data:', scripts);
                updateScriptNames();
                renderScripts();
                break;
              case 'stepUpdated':
                // Extension has confirmed the step change
                console.log('Extension confirmed step update to:', message.step);
                break;
            }
          });
          
          // Update names in formData when data is loaded
          function updateTerminalCollectionNames() {
            formData.terminalCollections.forEach(collection => {
              const loadedCollection = terminalCollections.find(c => c.id === collection.id);
              if (loadedCollection) {
                collection.name = loadedCollection.name;
              }
            });
            console.log('Updated terminal collection names:', formData.terminalCollections);
          }
          
          function updateScriptNames() {
            formData.scripts.forEach(script => {
              const loadedScript = scripts.find(s => s.id === script.id);
              if (loadedScript) {
                script.name = loadedScript.name;
              }
            });
            console.log('Updated script names:', formData.scripts);
          }

          // Initialize
          document.addEventListener('DOMContentLoaded', function() {
            console.log('DOMContentLoaded, initializing with currentStep:', currentStep);
            console.log('Initial formData:', formData);
            
            // Initialize the current step
            updateProgressBar(currentStep);
            updateButtons(currentStep);
            loadStepData(currentStep);
            
            // If we're starting on step 5, update the review step
            if (currentStep === 5) {
              console.log('Starting on step 5, updating review step');
              updateReviewStep();
            }
            
            if (currentStep === 1) {
              document.getElementById('name')?.focus();
            }
          });

          // Update form data on input changes
          document.addEventListener('input', function(e) {
            if (e.target.matches('input, textarea')) {
              updateFormData();
            }
          });
        </script>
      </body>
      </html>
    `;
  }



  private getStep1Content(): string {
    const sessionName = this.mode === "update" ? this.selectedSession?.name || "" : "";
    const sessionNotes = this.mode === "update" ? this.selectedSession?.notes || "" : "";
    const sessionTags = this.mode === "update" ? this.selectedSession?.tags?.join(", ") || "" : "";

    return `
      <div class="section">
        <h2>🎯 Session Details</h2>
        
        <div class="form-group">
          <label for="name">Session Name *</label>
          <input type="text" id="name" name="name" required placeholder="e.g., Feature Implementation, Bug Fix, Setup" value="${this.formData.name || sessionName}" ${this.mode === "update" ? "readonly" : ""}>
          <div class="description">${this.mode === "update" ? "Session name cannot be changed during update" : "A descriptive name for your session"}</div>
          <div class="error" id="nameError">Session name is required</div>
        </div>

        <div class="form-group">
          <label for="notes">Notes</label>
          <textarea id="notes" name="notes" placeholder="Optional notes about this session...">${this.formData.notes || sessionNotes}</textarea>
          <div class="description">Additional context or description for this session</div>
        </div>

        <div class="form-group">
          <label for="tags">Tags</label>
          <input type="text" id="tags" name="tags" placeholder="feature, bugfix, setup (comma-separated)" value="${this.formData.tags.length > 0 ? this.formData.tags.join(', ') : sessionTags}">
          <div class="description">Tags to help organize and find your sessions</div>
        </div>
      </div>
    `;
  }

  private getStep2Content(): string {
    const categorizedFiles = this.mode === "update" ? this.categorizeFiles() : null;
    
    return `
      <div class="section">
        <h2>📂 File State Capture</h2>
        <p>Currently open files in your workspace:</p>
        
        <div class="opened-files">
          ${this.mode === "update" ? this.renderCategorizedFiles(categorizedFiles!) : this.renderSimpleFileList()}
        </div>
        
        <button type="button" class="btn btn-secondary" onclick="refreshFiles()" style="margin-top: 15px;">🔄 Refresh File List</button>
      </div>
    `;
  }

  private getStep3Content(): string {
    return `
      <div class="section">
        <h2>🚀 Terminal Collections</h2>
        <p>Select terminal collections to execute when resuming this session:</p>
        
        <input type="text" class="search-box" placeholder="Search collections..." onkeyup="filterCollections(this.value)">
        
        <div id="terminalCollectionsContainer">
          <div style="text-align: center; padding: 20px; color: var(--vscode-descriptionForeground);">
            Loading terminal collections...
          </div>
        </div>
        
        <div class="description">
          Terminal collections will spawn terminals and execute their associated scripts automatically when resuming the session.
        </div>
      </div>
    `;
  }

  private getStep4Content(): string {
    return `
      <div class="section">
        <h2>📜 Scripts Selection</h2>
        <p>Select individual scripts to execute when resuming this session:</p>
        
        <input type="text" class="search-box" placeholder="Search scripts..." onkeyup="filterScripts(this.value)">
        
        <div id="scriptsContainer">
          <div style="text-align: center; padding: 20px; color: var(--vscode-descriptionForeground);">
            Loading scripts...
          </div>
        </div>
        
        <div class="description">
          Scripts will be executed in priority order when resuming the session. These are separate from terminal collection scripts.
        </div>
      </div>
    `;
  }

  private getStep5Content(): string {
    const fileStates = this.captureFileStates();
    const categorizedFiles = this.mode === "update" ? this.categorizeFiles() : null;
    
    return `
      <div class="section">
        <h2>✅ Review & Confirm</h2>
        
        <div id="reviewContent">
          <div class="summary-section">
            <h3>📋 Basic Information</h3>
            <div class="summary-item">
              <span class="summary-label">Name:</span>
              <span class="summary-value">${this.formData.name}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Notes:</span>
              <span class="summary-value">${this.formData.notes || 'None'}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Tags:</span>
              <span class="summary-value">${this.formData.tags.length > 0 ? this.formData.tags.join(', ') : 'None'}</span>
            </div>
          </div>

          <div class="summary-section">
            <h3>📂 File State</h3>
            <div class="summary-item">
              <span class="summary-label">Open Files:</span>
              <span class="summary-value">${fileStates.length} files</span>
            </div>
            ${this.mode === "update" && categorizedFiles ? `
            <div class="summary-item">
              <span class="summary-label">Changes:</span>
              <span class="summary-value">${categorizedFiles.new.length} new, ${categorizedFiles.removed.length} removed, ${categorizedFiles.unchanged.length} unchanged</span>
            </div>
            ` : ''}
          </div>

          <div class="summary-section">
            <h3>🚀 Terminal Collections</h3>
            <div class="summary-item">
              <span class="summary-label">Selected:</span>
              <span class="summary-value">${this.formData.terminalCollections.length} collections</span>
            </div>
          </div>

          <div class="summary-section">
            <h3>📜 Scripts</h3>
            <div class="summary-item">
              <span class="summary-label">Selected:</span>
              <span class="summary-value">${this.formData.scripts.length} scripts</span>
            </div>
          </div>

          ${this.hasUncommittedChanges ? `
          <div class="warning-banner" style="margin-top: 20px;">
            ⚠️ Git Status: Uncommitted changes detected
          </div>
          ` : ''}
        </div>
      </div>
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