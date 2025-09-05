import { GetScripts, ListSessions, Script, Session } from "@codestate/core";
import * as vscode from "vscode";
import { ErrorHandler } from "../../shared/errors/ErrorHandler";
import {
  ErrorContext,
  ExtensionError,
} from "../../shared/errors/ExtensionError";
import { ScriptPopoverProvider } from "./ScriptPopoverProvider";
import { SessionPopoverProvider } from "./SessionPopoverProvider";
import { SessionWebviewProvider } from "../webviews/SessionWebviewProvider";
import { CreateScriptWebviewProvider } from "../webviews/CreateScriptWebviewProvider";
import { DataCacheService } from "../../infrastructure/services/DataCacheService";
import { useCacheStore } from "../../shared/stores/cacheStore";

export class SessionsTreeDataProvider
  implements vscode.TreeDataProvider<vscode.TreeItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    vscode.TreeItem | undefined | null | void
  > = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    vscode.TreeItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  private errorHandler: ErrorHandler;
  private sessionPopoverProvider: SessionPopoverProvider;
  private scriptPopoverProvider: ScriptPopoverProvider;
  private sessionWebviewProvider: SessionWebviewProvider;
  private createScriptWebviewProvider: CreateScriptWebviewProvider;
  private dataCacheService: DataCacheService;
  private refreshTimeout: NodeJS.Timeout | null = null;
  private isRefreshing = false;
  private highlightedItemId: string | null = null;
  private highlightTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.errorHandler = ErrorHandler.getInstance();
    this.sessionPopoverProvider = new SessionPopoverProvider();
    this.scriptPopoverProvider = new ScriptPopoverProvider();
    this.sessionWebviewProvider = new SessionWebviewProvider();
    this.createScriptWebviewProvider = new CreateScriptWebviewProvider();
    this.dataCacheService = DataCacheService.getInstance();
    
    // Note: Removed automatic subscription to prevent infinite refresh loops
    // Tree view will be refreshed manually when needed via refreshCacheAndView()
  }

  private subscribeToCacheChanges(): void {
    // Removed automatic subscription to prevent infinite refresh loops
    // The tree view will be refreshed manually when operations complete
    console.log('SessionsTreeDataProvider: Automatic cache subscription disabled to prevent infinite loops');
  }

  dispose(): void {
    // Clean up timeout to prevent memory leaks
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    }
  }

  refresh(): void {
    // Debounce rapid successive refreshes
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
    
    this.refreshTimeout = setTimeout(() => {
      this._onDidChangeTreeData.fire();
    }, 100); // 100ms debounce
  }

  async refreshCacheAndView(): Promise<void> {
    // Prevent multiple simultaneous refresh operations
    if (this.isRefreshing) {
      console.log('SessionsTreeDataProvider: Refresh already in progress, skipping...');
      return;
    }

    try {
      this.isRefreshing = true;
      console.log('SessionsTreeDataProvider: Refreshing cache and view...');
      
      // Refresh both sessions and scripts cache
      await Promise.all([
        this.dataCacheService.getSessions(true),
        this.dataCacheService.getScripts(true)
      ]);
      
      // Refresh the tree view
      this.refresh();
      
      console.log('SessionsTreeDataProvider: Cache and view refreshed successfully');
    } catch (error) {
      console.error('SessionsTreeDataProvider: Error refreshing cache and view:', error);
    } finally {
      this.isRefreshing = false;
    }
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
    try {
      console.log('SessionsTreeDataProvider.getChildren called', { 
        element: element?.label, 
        contextValue: element?.contextValue,
        elementType: element?.constructor.name 
      });

      if (!element) {
        // Root level - show action items and projects
        console.log('Getting root level items...');
        const actionItems = this.getActionItems();
        console.log(`Action items: ${actionItems.length}`);
        
        const projects = await this.getProjects();
        console.log(`Projects: ${projects.length}`);
        
        const result = [...actionItems, ...projects];
        console.log(`Total root items: ${result.length}`);
        return result;
      }

      if (element instanceof ProjectTreeItem) {
        // Project level - show scripts and sessions groups
        const projectRoot = element.resourceUri?.fsPath;
        if (!projectRoot) {
          console.log("No project root found");
          return [];
        }

        console.log(`Expanding project: ${element.label} at ${projectRoot}`);

        const [scripts, sessions] = await Promise.all([
          this.getScriptsForProject(projectRoot),
          this.getSessionsForProject(projectRoot),
        ]);

        console.log(
          `Found ${scripts.length} scripts and ${sessions.length} sessions for project`
        );

        const items: vscode.TreeItem[] = [];

        // Add scripts group if there are scripts
        if (scripts.length > 0) {
          const scriptsGroup = new ScriptsTreeItem(projectRoot, scripts.length);
          items.push(scriptsGroup);
          console.log("Added scripts group");
        }

        // Add sessions group if there are sessions
        if (sessions.length > 0) {
          const sessionsGroup = new SessionsTreeItem(
            projectRoot,
            sessions.length
          );
          items.push(sessionsGroup);
          console.log("Added sessions group");
        }

        console.log(`Returning ${items.length} items for project expansion`);
        return items;
      }

      if (element.contextValue === "scripts") {
        // Scripts level - show individual scripts
        const projectRoot = element.resourceUri?.fsPath;
        if (!projectRoot) {
          return [];
        }

        return await this.getScriptsForProject(projectRoot);
      }

      if (element.contextValue === "sessions") {
        // Sessions level - show individual sessions
        const projectRoot = element.resourceUri?.fsPath;
        if (!projectRoot) {
          return [];
        }

        return await this.getSessionsForProject(projectRoot);
      }

      if (element.contextValue === "session") {
        // Session level - show session details
        const session = (element as SessionTreeItem).session;
        return this.getSessionDetails(session);
      }

      console.log('No matching element type found, returning empty array');
      return [];
    } catch (error) {
      console.error('Error in SessionsTreeDataProvider.getChildren:', error);
      
      const extensionError =
        error instanceof ExtensionError
          ? error
          : ExtensionError.fromError(
              error instanceof Error ? error : new Error(String(error)),
              undefined,
              ErrorContext.TREE_VIEW
            );

      this.errorHandler.handleError(
        extensionError,
        ErrorContext.TREE_VIEW,
        false
      );

      return [
        new vscode.TreeItem(
          "Error loading data",
          vscode.TreeItemCollapsibleState.None
        ),
      ];
    }
  }

  private async getProjects(): Promise<vscode.TreeItem[]> {
    try {
      // Get ALL sessions and scripts from @codestate/core (not filtered by current workspace)
      const [sessionsResult, scriptsResult] = await Promise.all([
        this.getAllSessions(),
        this.getAllScripts(),
      ]);

      // Group sessions and scripts by project root
      const projectMap = new Map<
        string,
        { sessions: any[]; scripts: any[]; name: string }
      >();

      // Add sessions to project map
      sessionsResult.forEach((session) => {
        const projectRoot = session.projectRoot;
        const normalizedProjectRoot = projectRoot.toLowerCase();
        if (!projectMap.has(normalizedProjectRoot)) {
          projectMap.set(normalizedProjectRoot, {
            sessions: [],
            scripts: [],
            name: this.getProjectName(projectRoot),
          });
        }
        projectMap.get(normalizedProjectRoot)!.sessions.push(session);
      });

      // Add scripts to project map
      scriptsResult.forEach((script) => {
        const projectRoot = script.rootPath;
        const normalizedProjectRoot = projectRoot.toLowerCase();
        if (!projectMap.has(normalizedProjectRoot)) {
          projectMap.set(normalizedProjectRoot, {
            sessions: [],
            scripts: [],
            name: this.getProjectName(projectRoot),
          });
        }
        projectMap.get(normalizedProjectRoot)!.scripts.push(script);
      });

      // Create project tree items
      const projects: vscode.TreeItem[] = [];

      console.log("Project map entries:", projectMap.size);

      for (const [normalizedProjectRoot, data] of projectMap) {
        console.log(
          `Project ${data.name}: ${data.sessions.length} sessions, ${data.scripts.length} scripts`
        );
        // Only show projects that have sessions or scripts
        if (data.sessions.length > 0 || data.scripts.length > 0) {
          const projectItem = new ProjectTreeItem(
            data.name,
            normalizedProjectRoot,
            data.sessions.length,
            data.scripts.length
          );
          projects.push(projectItem);
          console.log(`Created project item for ${data.name}`);
        }
      }

      if (projects.length === 0) {
        console.log("No projects found, showing help message");
        return [
          new vscode.TreeItem(
            "No projects with sessions or scripts found",
            vscode.TreeItemCollapsibleState.None
          ),
          new vscode.TreeItem(
            "💡 Save a session or add a script to get started",
            vscode.TreeItemCollapsibleState.None
          ),
        ];
      }

      return projects;
    } catch (error) {
      return [
        new vscode.TreeItem(
          "Error loading projects",
          vscode.TreeItemCollapsibleState.None
        ),
      ];
    }
  }

  private async getAllSessions(): Promise<any[]> {
    try {
      console.log("Getting all sessions from cache...");
      
      // Use the data cache service to get sessions
      await this.dataCacheService.getSessions();
      
      // Get the sessions from the store
      const store = useCacheStore.getState();
      
      console.log("Sessions from cache:", store.sessions.length);
      return store.sessions;
    } catch (error) {
      console.error("Error getting sessions from cache:", error);
      console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      return [];
    }
  }

  private async getAllScripts(): Promise<any[]> {
    try {
      console.log("Getting all scripts from cache...");
      
      // Use the data cache service to get scripts
      await this.dataCacheService.getScripts();
      
      // Get the scripts from the store
      const store = useCacheStore.getState();
      
      console.log("Scripts from cache:", store.scripts.length);
      return store.scripts;
    } catch (error) {
      console.error("Error getting scripts from cache:", error);
      console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      return [];
    }
  }

  private getActionItems(): vscode.TreeItem[] {
    const actionItems: vscode.TreeItem[] = [];

    // Only show action items if we have a current workspace
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      actionItems.push(new AddSessionTreeItem());
      actionItems.push(new UpdateSessionTreeItem());
      actionItems.push(new AddScriptTreeItem());
      actionItems.push(new SeparatorTreeItem());
    }

    return actionItems;
  }

  private getProjectName(projectRoot: string): string {
    // Extract project name from path
    const pathParts = projectRoot.split(/[\\/]/);
    return pathParts[pathParts.length - 1] || projectRoot;
  }

  private async getSessionsForProject(
    projectRoot: string
  ): Promise<vscode.TreeItem[]> {
    try {
      const sessions = await this.getAllSessions();
      console.log(
        `Filtering ${sessions.length} sessions for project root: ${projectRoot}`
      );

      sessions.forEach((session) => {
        console.log(
          `Session "${session.name}" has projectRoot: "${session.projectRoot}"`
        );
      });

      const normalizedProjectRoot = projectRoot.toLowerCase();
      const projectSessions = sessions.filter(
        (session) => session.projectRoot.toLowerCase() === normalizedProjectRoot
      );

      console.log(`Found ${projectSessions.length} sessions for project`);

      if (projectSessions.length === 0) {
        return [];
      }

      const sessionItems: vscode.TreeItem[] = [];
      for (const session of projectSessions) {
        try {
          console.log(`Creating SessionTreeItem for session: ${session.name}`);
          const sessionItem = new SessionTreeItem(session);
          sessionItems.push(sessionItem);
          console.log(
            `Successfully created SessionTreeItem for: ${session.name}`
          );
        } catch (error) {
          console.log(
            `Error creating SessionTreeItem for session ${session.name}:`,
            error
          );
          // Create a fallback item
          const fallbackItem = new vscode.TreeItem(
            session.name,
            vscode.TreeItemCollapsibleState.None
          );
          fallbackItem.description = "Error loading session details";
          sessionItems.push(fallbackItem);
        }
      }

      return sessionItems;
    } catch (error) {
      console.log("Error in getSessionsForProject:", error);
      return [
        new vscode.TreeItem(
          "Error loading sessions",
          vscode.TreeItemCollapsibleState.None
        ),
      ];
    }
  }

  private async getScriptsForProject(
    projectRoot: string
  ): Promise<vscode.TreeItem[]> {
    try {
      const scripts = await this.getAllScripts();
      console.log(
        `Filtering ${scripts.length} scripts for project root: ${projectRoot}`
      );

      scripts.forEach((script) => {
        console.log(
          `Script "${script.name}" has rootPath: "${script.rootPath}"`
        );
      });

      const normalizedProjectRoot = projectRoot.toLowerCase();
      const projectScripts = scripts.filter(
        (script) => script.rootPath.toLowerCase() === normalizedProjectRoot
      );

      console.log(`Found ${projectScripts.length} scripts for project`);

      if (projectScripts.length === 0) {
        return [];
      }

      return projectScripts.map((script) => new ScriptTreeItem(script, this));
    } catch (error) {
      return [
        new vscode.TreeItem(
          "Error loading scripts",
          vscode.TreeItemCollapsibleState.None
        ),
      ];
    }
  }

  private getSessionDetails(session: Session): vscode.TreeItem[] {
    try {
      console.log('getSessionDetails called for session:', {
        name: session.name,
        hasGit: !!session.git,
        gitBranch: session.git?.branch,
        hasFiles: !!session.files,
        filesCount: session.files?.length || 0,
        hasTags: !!session.tags,
        tagsCount: session.tags?.length || 0,
        hasNotes: !!session.notes
      });
      
      const details: vscode.TreeItem[] = [];

      // Files
      if (session.files && Array.isArray(session.files) && session.files.length > 0) {
        const filesItem = new vscode.TreeItem(
          `📄 Files (${session.files.length})`,
          vscode.TreeItemCollapsibleState.Collapsed
        );
        filesItem.contextValue = "files";
        filesItem.resourceUri = vscode.Uri.file(session.projectRoot);
        details.push(filesItem);

        // Add individual files as children
        session.files.forEach((file) => {
          // Display relative path in UI, but use full path for resource URI
          const relativePath = file.path.startsWith(session.projectRoot) 
            ? file.path.replace(session.projectRoot, '').replace(/^[\\\/]/, '')
            : file.path;
          const fileName = relativePath.split("/").pop() || relativePath;
          
          const fileItem = new vscode.TreeItem(
            relativePath, // Show relative path in tree view
            vscode.TreeItemCollapsibleState.None
          );
          fileItem.contextValue = "file";
          fileItem.resourceUri = vscode.Uri.file(file.path); // Use full path for URI
          fileItem.tooltip = file.path; // Show full path in tooltip

          if (file.isActive) {
            fileItem.description = "active";
          }

          details.push(fileItem);
        });
      }

      // Git branch
      // if (session.git && session.git.branch) {
      //   const branchItem = new vscode.TreeItem(
      //     `🌿 Branch: ${session.git.branch}`,
      //     vscode.TreeItemCollapsibleState.None
      //   );
      //   details.push(branchItem);
      // } else {
      //   const branchItem = new vscode.TreeItem(
      //     `🌿 Branch: unknown`,
      //     vscode.TreeItemCollapsibleState.None
      //   );
      //   details.push(branchItem);
      // }

      // Tags
      if (session.tags && Array.isArray(session.tags) && session.tags.length > 0) {
        const tagsItem = new vscode.TreeItem(
          `🏷️ Tags: ${session.tags.join(", ")}`,
          vscode.TreeItemCollapsibleState.None
        );
        details.push(tagsItem);
      }

      // Notes
      if (session.notes) {
        const notesItem = new vscode.TreeItem(
          `📝 Notes: ${session.notes}`,
          vscode.TreeItemCollapsibleState.None
        );
        details.push(notesItem);
      }

      console.log(`getSessionDetails completed for session "${session.name}" with ${details.length} detail items`);
      return details;
    } catch (error) {
      console.error('Error in getSessionDetails:', error);
      return [
        new vscode.TreeItem(
          "Error loading session details",
          vscode.TreeItemCollapsibleState.None
        )
      ];
    }
  }

  // Method to highlight a newly created item
  highlightNewItem(itemId: string, itemType: 'script' | 'session'): void {
    // Clear any existing highlight
    if (this.highlightTimeout) {
      clearTimeout(this.highlightTimeout);
    }
    
    this.highlightedItemId = itemId;
    
    // Refresh the tree to show the highlight
    this.refresh();
    
    // Remove highlight after 3 seconds
    this.highlightTimeout = setTimeout(() => {
      this.highlightedItemId = null;
      this.refresh();
    }, 3000);
  }

  // Method to check if an item should be highlighted
  isItemHighlighted(itemId: string): boolean {
    return this.highlightedItemId === itemId;
  }

  // Method to get the project root path for a script
  async getProjectRootForScript(scriptId: string): Promise<string | null> {
    try {
      const scripts = await this.getAllScripts();
      const script = scripts.find(s => s.id === scriptId);
      return script ? script.rootPath : null;
    } catch (error) {
      console.error('Error getting project root for script:', error);
      return null;
    }
  }
}

class ProjectTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly projectRoot: string,
    sessionCount: number,
    scriptCount: number
  ) {
    super(label, vscode.TreeItemCollapsibleState.Collapsed);

    // Don't set contextValue to avoid context menu items
    this.resourceUri = vscode.Uri.file(projectRoot);
    this.tooltip = projectRoot;
    this.description = `${sessionCount} sessions, ${scriptCount} scripts`;
  }
}

class ScriptsTreeItem extends vscode.TreeItem {
  constructor(projectRoot: string, scriptCount: number) {
    super("🖥️ Scripts", vscode.TreeItemCollapsibleState.Collapsed);

    this.contextValue = "scripts";
    this.resourceUri = vscode.Uri.file(projectRoot);
    this.description = `(${scriptCount})`;
  }
}

class SessionsTreeItem extends vscode.TreeItem {
  constructor(projectRoot: string, sessionCount: number) {
    super("📄 Sessions", vscode.TreeItemCollapsibleState.Collapsed);

    this.contextValue = "sessions";
    this.resourceUri = vscode.Uri.file(projectRoot);
    this.description = `(${sessionCount})`;
  }
}

class SessionTreeItem extends vscode.TreeItem {
  constructor(public readonly session: Session) {
    super(session.name, vscode.TreeItemCollapsibleState.Collapsed);

    try {
      console.log(`SessionTreeItem constructor - session:`, session);

      this.contextValue = "session";
      this.resourceUri = vscode.Uri.file(session.projectRoot);
      // Create enhanced tooltip with session details
      const tooltipParts = [];
      if (session.notes) {
        tooltipParts.push(`Notes: ${session.notes}`);
      }
      if (session.tags && session.tags.length > 0) {
        tooltipParts.push(`Tags: ${session.tags.join(', ')}`);
      }
      if (session.terminalCollections && session.terminalCollections.length > 0) {
        tooltipParts.push(`Terminal Collections: ${session.terminalCollections.length}`);
      }
      if (session.scripts && session.scripts.length > 0) {
        tooltipParts.push(`Scripts: ${session.scripts.length}`);
      }
      if (session.files && session.files.length > 0) {
        tooltipParts.push(`Files: ${session.files.length}`);
      }
      
      this.tooltip = tooltipParts.length > 0 ? tooltipParts.join('\n') : session.name;

      // Set icon based on session type
      console.log(`Getting session icon for: ${session.name}`);
      this.iconPath = new vscode.ThemeIcon(this.getSessionIcon(session));

      // Set description with time ago and metadata
      console.log(
        `Getting time ago for: ${session.name}, updatedAt:`,
        session.updatedAt
      );
      const timeAgo = this.getTimeAgo(session.updatedAt);
      const metadata = [];
      
      if (session.terminalCollections && session.terminalCollections.length > 0) {
        metadata.push(`🚀 ${session.terminalCollections.length}`);
      }
      if (session.scripts && session.scripts.length > 0) {
        metadata.push(`📜 ${session.scripts.length}`);
      }
      if (session.files && session.files.length > 0) {
        metadata.push(`📂 ${session.files.length}`);
      }
      
      this.description = metadata.length > 0 ? `${timeAgo} • ${metadata.join(' ')}` : timeAgo;

      // Make clickable for popover
      this.command = {
        command: "codestate.session.showPopover",
        title: "Show Session Popover",
        arguments: [session],
      };

      console.log(
        `SessionTreeItem constructor completed successfully for: ${session.name}`
      );
    } catch (error) {
      console.log(
        `Error in SessionTreeItem constructor for ${session.name}:`,
        error
      );
      throw error;
    }
  }

  private getSessionIcon(session: Session): string {
    try {
      console.log(`getSessionIcon called for session: ${session.name}`);
      const name = session.name.toLowerCase();
      const tags = session.tags && Array.isArray(session.tags) 
        ? session.tags.map((tag) => tag.toLowerCase())
        : [];

      console.log(`Session name: "${name}", tags:`, tags);

      if (name.includes("feature") || tags.includes("feature")) {
        return "rocket";
      }
      if (
        name.includes("bug") ||
        name.includes("fix") ||
        tags.includes("bug")
      ) {
        return "bug";
      }
      if (name.includes("refactor") || tags.includes("refactor")) {
        return "edit";
      }
      if (name.includes("setup") || tags.includes("setup")) {
        return "gear";
      }
      if (
        name.includes("ui") ||
        name.includes("design") ||
        tags.includes("ui")
      ) {
        return "paintbrush";
      }
      if (name.includes("doc") || tags.includes("doc")) {
        return "book";
      }
      if (name.includes("test") || tags.includes("test")) {
        return "beaker";
      }

      console.log(`Returning default icon 'file' for session: ${session.name}`);
      return "file";
    } catch (error) {
      console.log(
        `Error in getSessionIcon for session ${session.name}:`,
        error
      );
      return "file"; // fallback
    }
  }

  private getTimeAgo(date: Date | string): string {
    try {
      console.log(`getTimeAgo called with date:`, date);

      // Convert string to Date if needed
      const dateObj = typeof date === "string" ? new Date(date) : date;

      if (isNaN(dateObj.getTime())) {
        console.log(`Invalid date: ${date}`);
        return "Unknown time";
      }

      const now = new Date();
      const diffInMs = now.getTime() - dateObj.getTime();
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      console.log(
        `Time difference: ${diffInMinutes} minutes, ${diffInHours} hours, ${diffInDays} days`
      );

      if (diffInMinutes < 1) {
        return "Just now";
      }
      if (diffInMinutes < 60) {
        return `${diffInMinutes}m ago`;
      }
      if (diffInHours < 24) {
        return `${diffInHours}h ago`;
      }
      if (diffInDays < 7) {
        return `${diffInDays}d ago`;
      }

      const result = dateObj.toLocaleDateString();
      console.log(`getTimeAgo result: ${result}`);
      return result;
    } catch (error) {
      console.log(`Error in getTimeAgo:`, error);
      return "Unknown time"; // fallback
    }
  }
}

class ScriptTreeItem extends vscode.TreeItem {
  constructor(public readonly script: Script, private treeDataProvider?: SessionsTreeDataProvider) {
    super(script.name, vscode.TreeItemCollapsibleState.None);

    this.contextValue = "script";
    this.resourceUri = vscode.Uri.file(script.rootPath);
    
    // Handle new Script interface with commands array
    if (script.commands && script.commands.length > 0) {
      const commandText = script.commands.map(cmd => cmd.command).join(' && ');
      this.tooltip = `${script.name}\nCommands: ${commandText}\nLifecycle: ${script.lifecycle?.join(', ') || 'none'}\nExecution: ${script.executionMode || 'same-terminal'}`;
      this.description = commandText.length > 50 ? commandText.substring(0, 50) + '...' : commandText;
    } else {
      // Fallback to legacy script field
      this.tooltip = script.script || 'No command specified';
      this.description = script.script || 'No command specified';
    }

    this.iconPath = new vscode.ThemeIcon("terminal");

    // Make clickable for popover
    this.command = {
      command: "codestate.script.showPopover",
      title: "Show Script Popover",
      arguments: [script],
    };

    // Apply highlighting if this is the highlighted item
    if (this.treeDataProvider && this.treeDataProvider.isItemHighlighted(script.id)) {
      this.applyHighlight();
    }
  }

  private applyHighlight(): void {
    // Add a custom CSS class for highlighting
    this.iconPath = new vscode.ThemeIcon("star", new vscode.ThemeColor("notificationsInfoIcon.foreground"));
    
    // Add a temporary description to indicate it's new
    const originalDescription = this.description;
    this.description = "✨ New";
    
    // Restore original description after highlight period
    setTimeout(() => {
      this.description = originalDescription;
      this.iconPath = new vscode.ThemeIcon("terminal");
    }, 3000);
  }
}

class AddSessionTreeItem extends vscode.TreeItem {
  constructor() {
    super("➕ Add Session", vscode.TreeItemCollapsibleState.None);

    this.contextValue = "action";
    this.tooltip = "Save current workspace state as a new session";
    this.iconPath = undefined;

    this.command = {
      command: "codestate.createSession",
      title: "Add Session",
    };
  }
}



class AddScriptTreeItem extends vscode.TreeItem {
  constructor() {
    super("➕ Add Script", vscode.TreeItemCollapsibleState.None);

    this.contextValue = "action";
    this.tooltip = "Add a new script for the current project";
    this.iconPath = undefined;

    this.command = {
      command: "codestate.createScript",
      title: "Add Script",
    };
  }
}

class UpdateSessionTreeItem extends vscode.TreeItem {
  constructor() {
    super("📝 Update Session", vscode.TreeItemCollapsibleState.None);

    this.contextValue = "action";
    this.tooltip = "Update an existing session with current state";
    this.iconPath = undefined;

    this.command = {
      command: "codestate.updateSessionWebview",
      title: "Update Session",
    };
  }
}

class SeparatorTreeItem extends vscode.TreeItem {
  constructor() {
    super("─────────────────", vscode.TreeItemCollapsibleState.None);

    this.contextValue = "separator";
    this.tooltip = "";
    this.iconPath = undefined;
    this.description = "";
  }
}
