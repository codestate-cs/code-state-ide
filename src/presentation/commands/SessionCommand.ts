import {
  FileState,
  GitService,
  GitState,
  ListSessions,
  SaveSession,
  Session,
  UpdateSession,
} from "@codestate/core";
import * as vscode from "vscode";
import { Messages } from "../../shared/constants/Messages";
import { ErrorHandler } from "../../shared/errors/ErrorHandler";
import {
  ErrorContext,
  ExtensionError,
} from "../../shared/errors/ExtensionError";
import { DataCacheService } from "../../infrastructure/services/DataCacheService";

export class SessionCommand {
  private static errorHandler: ErrorHandler;

  static async execute(
    mode: "create" | "update" = "create",
    sessionToUpdate?: Session,
          sessionData?: {
        name?: string;
        notes?: string;
        tags?: string[];
        files?: FileState[];
        terminalCommands?: any[];
        terminalCollections?: string[];
        scripts?: string[];
      }
  ): Promise<void> {
    try {
      if (!this.errorHandler) {
        this.errorHandler = ErrorHandler.getInstance();
      }

      // Pre-command Git state check
      const shouldProceed = await this.checkPreCommandGitState();
      if (!shouldProceed) {
        return; // User cancelled or Git operation failed
      }

      // Use passed session data or check for temporary session data from webview
      let session: Session | undefined;
      let updateData:
        | {
            name?: string;
            notes?: string;
            tags?: string[];
            files?: FileState[];
            terminalCommands?: any[];
            terminalCollections?: string[];
            scripts?: string[];
          }
        | undefined;

      if (sessionData) {
        // Use data passed directly to the command
        updateData = sessionData;
        console.log("SessionCommand: Using passed sessionData:", updateData);
        console.log("SessionCommand: mode:", mode);
        console.log("SessionCommand: sessionToUpdate:", sessionToUpdate);
        
        // For update mode, we need to ensure we have the session
        if (mode === "update") {
          console.log("SessionCommand: Update mode detected");
          if (sessionToUpdate) {
            // Use the provided session
            session = sessionToUpdate;
            console.log("SessionCommand: Using provided sessionToUpdate:", session);
          } else {
            console.log("SessionCommand: No sessionToUpdate provided, will select from list");
            // Get session from user selection for update mode
            const selectedSession = await this.selectSessionToUpdate();
            if (!selectedSession) {
              console.log("SessionCommand: No session selected, user cancelled");
              return; // User cancelled
            }
            session = selectedSession;
            console.log("SessionCommand: Selected session from list:", session);
          }
        }
      } else {
        // Fallback to global variable for backward compatibility
        const tempData = (globalThis as any).__tempSessionData;
        console.log("SessionCommand: tempData from webview:", tempData);
        
        if (tempData) {
          // Use data from webview
          updateData = {
            name: tempData.name,
            notes: tempData.notes,
            tags: tempData.tags,
            files: tempData.files,
            terminalCommands: tempData.terminalCommands || [],
            terminalCollections: tempData.terminalCollections || [],
            scripts: tempData.scripts || [],
          };
          console.log("SessionCommand: Created updateData from tempData:", updateData);

          if (tempData.mode === "update" && tempData.sessionId) {
            // Get the session by ID for update mode
            const listSessions = new ListSessions();
            const sessionsResult = await listSessions.execute({});
            if (!sessionsResult.ok) {
              throw new Error("Failed to load sessions");
            }

            const foundSession = sessionsResult.value.find(
              (s) => s.id === tempData.sessionId
            );
            if (!foundSession) {
              throw new Error("Session not found");
            }
            session = foundSession;
          }
        } else {
          // Check if workspace is open
          const workspaceFolders = vscode.workspace.workspaceFolders;
          if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage(
              Messages.WORKSPACE_REQUIRED || "No workspace folder is open"
            );
            return;
          }

          if (sessionToUpdate) {
            // Use the provided session
            session = sessionToUpdate;
          } else if (mode === "update") {
            // Get session from user selection for update mode
            const selectedSession = await this.selectSessionToUpdate();
            if (!selectedSession) {
              return; // User cancelled
            }
            session = selectedSession;
          }
        }
      }

      const projectRoot = vscode.workspace.workspaceFolders![0].uri.fsPath;

      // Show progress with detailed steps
      const progressTitle =
        mode === "create" ? "Creating session..." : "Updating session...";
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: progressTitle,
          cancellable: false,
        },
        async (progress) => {
          progress.report({
            increment: 0,
            message: "Capturing current state...",
          });

          // Get files and metadata
          progress.report({
            increment: 30,
            message: "Capturing VS Code state...",
          });
          let files: FileState[] = [];
          let notes: string | undefined;
          let tags: string[] = [];
          let sessionName: string = "";

          // ALWAYS use webview data - this command should only be called from webview
          if (!updateData) {
            console.error("SessionCommand: No updateData available.");
            vscode.window.showErrorMessage(
              "Session data not found. Please use the webview to create or update sessions. If this error persists, try refreshing the extension."
            );
            return;
          }

          // Use data from webview
          sessionName = updateData.name!;
          notes = updateData.notes;
          tags = updateData.tags || [];
          files = updateData.files || [];
          console.log(
            `SessionCommand: Using webview data - Name: "${sessionName}", Notes: "${notes}", Tags: ${tags.length}, Files: ${files.length}`
          );

          // Capture git state
          progress.report({ increment: 20, message: "Capturing git state..." });
          const git = await this.captureGitState(projectRoot);

          // Check if Git state capture was successful and handle dirty state
          if (git.isDirty) {
            const choice = await vscode.window.showWarningMessage(
              "You have uncommitted changes in your Git repository. What would you like to do?",
              "Commit Changes",
              "Save Anyway"
            );

            switch (choice) {
              case "Commit Changes":
                const commitSuccess = await this.handleGitCommit(projectRoot);
                if (!commitSuccess) {
                  return; // User cancelled or commit failed
                }
                break;
              case "Save Anyway":
                // Continue with dirty state
                break;
              default:
                return; // User cancelled
            }
          }

          // Create or update session
          progress.report({
            increment: 30,
            message:
              mode === "create" ? "Creating session..." : "Updating session...",
          });

          if (mode === "create") {
            const saveSession = new SaveSession();
            const result = await saveSession.execute({
              name: sessionName,
              projectRoot,
              notes,
              tags,
              files: files.length > 0 ? files : undefined,
              git,
              extensions: {},
              terminalCommands: updateData?.terminalCommands || [],
              terminalCollections: updateData?.terminalCollections || [],
              scripts: updateData?.scripts || [],
            });

            if (!result.ok) {
              throw new Error(
                `Failed to save session: ${result.error.message}`
              );
            }
          } else {
            // Ensure we have a session for update mode
            if (!session) {
              throw new Error("No session selected for update. Please select a session to update.");
            }
            
            const updateSession = new UpdateSession();
            const result = await updateSession.execute(session.id, {
              notes,
              tags,
              files,
              git,
              extensions: {},
              terminalCommands: updateData?.terminalCommands || [],
              terminalCollections: updateData?.terminalCollections || [],
              scripts: updateData?.scripts || [],
            });

            if (!result.ok) {
              throw new Error(
                `Failed to update session: ${result.error.message}`
              );
            }
          }

          progress.report({
            increment: 20,
            message: `Session ${
              mode === "create" ? "created" : "updated"
            } successfully!`,
          });

          // Show success message
          const successMessage =
            mode === "create"
              ? `Session "${
                  updateData?.name || sessionName || "Unknown"
                }" created successfully!`
              : `Session "${session?.name}" updated successfully!`;

          vscode.window.showInformationMessage(successMessage);

          // Clear sessions cache to ensure fresh data
          const dataCacheService = DataCacheService.getInstance();
          dataCacheService.clearSessionsCache();

          // Refresh the sessions view after successful operation
          await vscode.commands.executeCommand("codestate.refreshSessions");
        }
      );

      // Clean up any temporary session data if it exists (for backward compatibility)
      if ((globalThis as any).__tempSessionData) {
        delete (globalThis as any).__tempSessionData;
      }
    } catch (error) {
      // Clean up any temporary session data if it exists (for backward compatibility)
      if ((globalThis as any).__tempSessionData) {
        delete (globalThis as any).__tempSessionData;
      }

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
          `Failed to ${mode} session. Check the output panel for details.`,
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

  private static async selectSessionToUpdate(): Promise<Session | undefined> {
    const projectRoot = vscode.workspace.workspaceFolders![0].uri.fsPath;

    // Get available sessions for this project
    const listSessions = new ListSessions();
    const sessionsResult = await listSessions.execute({
      search: projectRoot,
    });

    if (!sessionsResult.ok) {
      throw new Error("Failed to load sessions");
    }

    const sessions = sessionsResult.value.filter(
      (session) => session.projectRoot === projectRoot
    );

    if (sessions.length === 0) {
      vscode.window.showInformationMessage(
        "No sessions found for this project. Save a session first."
      );
      return undefined;
    }

    // Show session picker
    const sessionItems = sessions.map((session) => ({
      label: session.name,
      description: session.notes || "",
      detail: `Updated: ${session.updatedAt.toLocaleDateString()} | Tags: ${session.tags.join(
        ", "
      )}`,
      session,
    }));

    const selected = await vscode.window.showQuickPick(sessionItems, {
      placeHolder: "Select a session to update",
      matchOnDescription: true,
      matchOnDetail: true,
    });

    return selected?.session;
  }



  private static async captureFileStates(): Promise<FileState[]> {
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
        // Store full path for session data
        const fullPath = document.fileName;
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
                // Store full path for session data
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

  private static async handleGitCommit(projectRoot: string): Promise<boolean> {
    try {
      const commitMessage = await vscode.window.showInputBox({
        prompt: "Enter commit message",
        placeHolder: "Save current work before session",
        value: "Save current work before session",
      });

      if (!commitMessage) {
        return false; // User cancelled
      }

      const gitService = new GitService(projectRoot);
      const result = await gitService.commitChanges(commitMessage);

      if (!result.ok) {
        vscode.window.showErrorMessage(
          `Failed to commit changes: ${result.error.message || "Unknown error"}`
        );
        return false;
      }

      if (!result.value) {
        vscode.window.showErrorMessage(
          "Failed to commit changes: Commit operation returned false"
        );
        return false;
      }

      vscode.window.showInformationMessage("Changes committed successfully");
      return true;
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to commit changes: ${error}`);
      return false;
    }
  }



  private static async captureGitState(projectRoot: string): Promise<GitState> {
    try {
      const gitService = new GitService(projectRoot);

      // Check if this is a git repository
      const isGitRepo = await gitService.isGitRepository();
      if (!isGitRepo.ok || !isGitRepo.value) {
        return {
          branch: "unknown",
          commit: "unknown",
          isDirty: false,
          stashId: null,
        };
      }

      // Get current branch
      const branchResult = await gitService.getCurrentBranch();
      const branch = branchResult.ok ? branchResult.value : "unknown";

      // Get current commit
      const commitResult = await gitService.getCurrentCommit();
      const commit = commitResult.ok ? commitResult.value : "unknown";

      // Check if repository is dirty
      const isDirtyResult = await gitService.getIsDirty();
      const isDirty = isDirtyResult.ok ? isDirtyResult.value : false;

      return {
        branch,
        commit,
        isDirty, // Keep the actual dirty state
        stashId: undefined, // No stash functionality
      };
    } catch (error) {
      console.warn("Failed to capture git state:", error);
      return {
        branch: "unknown",
        commit: "unknown",
        isDirty: false,
        stashId: null,
      };
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

      // Check for untracked files (new files that can't be stashed)
      const gitStatus = await gitService.getDirtyData();
      const hasUntrackedFiles =
        gitStatus.ok && gitStatus.value.untrackedFiles.length > 0;
      const canStash = !hasUntrackedFiles;

            // Show options - only commit or save anyway
      const choice = await vscode.window.showWarningMessage(
        "You have uncommitted changes in your Git repository. What would you like to do?",
        "Commit Changes",
        "Save Anyway",
        "Cancel"
      );

      switch (choice) {
        case "Commit Changes":
          return await this.handleGitCommit(projectRoot);
        case "Save Anyway":
          return true; // Proceed with dirty state
        case "Cancel":
        default:
          return false; // User cancelled
      }
    } catch (error) {
      console.warn("Failed to check pre-command Git state:", error);
      // If Git check fails, proceed anyway (fallback to existing checks)
      return true;
    }
  }

  static register(context: vscode.ExtensionContext): vscode.Disposable[] {
    return [
      vscode.commands.registerCommand("codestate.saveSession", (mode?: string, sessionToUpdate?: Session, sessionData?: any) => {
        this.execute(mode as "create" | "update" || "create", sessionToUpdate, sessionData);
      }),
      vscode.commands.registerCommand("codestate.updateSession", (mode?: string, sessionToUpdate?: Session, sessionData?: any) => {
        this.execute(mode as "create" | "update" || "update", sessionToUpdate, sessionData);
      }),
    ];
  }
}
