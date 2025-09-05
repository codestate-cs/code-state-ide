import { ListTerminalCollections, TerminalCollectionWithScripts, isSuccess } from "@codestate/core";
import * as vscode from "vscode";
import { ErrorHandler } from "../../shared/errors/ErrorHandler";
import { ExtensionError, ErrorContext } from "../../shared/errors/ExtensionError";
import { DataCacheService } from "../../infrastructure/services/DataCacheService";

export class TerminalsTreeDataProvider
  implements vscode.TreeDataProvider<vscode.TreeItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    vscode.TreeItem | undefined | null | void
  > = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    vscode.TreeItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  private errorHandler: ErrorHandler;
  private dataCacheService: DataCacheService;
  private refreshTimeout: NodeJS.Timeout | null = null;
  private isRefreshing = false;

  constructor() {
    this.errorHandler = ErrorHandler.getInstance();
    this.dataCacheService = DataCacheService.getInstance();
  }

  dispose(): void {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    }
  }

  refresh(): void {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
    
    this.refreshTimeout = setTimeout(() => {
      this._onDidChangeTreeData.fire();
    }, 100);
  }

  async refreshCacheAndView(): Promise<void> {
    if (this.isRefreshing) {
      console.log('TerminalsTreeDataProvider: Refresh already in progress, skipping...');
      return;
    }

    try {
      this.isRefreshing = true;
      console.log('TerminalsTreeDataProvider: Refreshing cache and view...');
      
      // Refresh terminal collections cache
      await this.dataCacheService.getTerminalCollections(true);
      
      // Refresh the tree view
      this.refresh();
      
      console.log('TerminalsTreeDataProvider: Cache and view refreshed successfully');
    } catch (error) {
      console.error('TerminalsTreeDataProvider: Error refreshing cache and view:', error);
    } finally {
      this.isRefreshing = false;
    }
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
    try {
      if (!element) {
        // Root level - show all terminal collections + action items
        const collectionItems = await this.getAllTerminalCollections();
        const actionItems = this.getActionItems();
        return [...actionItems, ...collectionItems];
      } else if (element.contextValue === 'terminalCollection') {
        // Terminal collection level - show scripts in this collection
        console.log('Terminal collection element:', {
          label: element.label,
          contextValue: element.contextValue,
          command: element.command,
          arguments: element.command?.arguments,
          hasCollectionData: !!(element as any).collectionData
        });
        
        // Try to get collection data from stored property first, fallback to command arguments
        let collection = (element as any).collectionData as TerminalCollectionWithScripts;
        if (!collection) {
          collection = (element.command?.arguments?.[0] as TerminalCollectionWithScripts);
        }
        
        if (!collection) {
          console.error('No collection data found for terminal collection item');
          return [];
        }
        
        // Validate collection structure
        if (!collection.name || !collection.rootPath) {
          console.error('Invalid collection data structure:', collection);
          return [];
        }
        
        console.log('Getting scripts for collection:', collection.name, 'with', collection.scripts?.length || 0, 'scripts');
        return this.getScriptsForCollection(collection);
      }
      
      return [];
    } catch (error) {
      console.error('Error getting tree children:', error);
      this.errorHandler.handleError(
        new ExtensionError(
          'Failed to load terminal collections',
          undefined,
          ErrorContext.TREE_VIEW
        )
      );
      return [];
    }
  }

  private async getAllTerminalCollections(): Promise<vscode.TreeItem[]> {
    try {
      console.log('Fetching terminal collections...');
      const listTerminalCollections = new ListTerminalCollections();
      const result = await listTerminalCollections.execute();
      
      if (!isSuccess(result)) {
        throw new Error('Failed to list terminal collections');
      }

      const collections = result.value;
      console.log('Found', collections.length, 'terminal collections');
      
      // Create flat list of terminal collections
      return collections.map((collection: TerminalCollectionWithScripts) => {
        console.log('Processing collection:', {
          name: collection.name,
          rootPath: collection.rootPath,
          scriptsCount: collection.scripts?.length || 0,
          lifecycle: collection.lifecycle
        });
        
        const item = new vscode.TreeItem(
          collection.name,
          vscode.TreeItemCollapsibleState.Collapsed
        );
        
        item.tooltip = this.formatTerminalCollectionTooltip(collection);
        item.contextValue = 'terminalCollection';
        item.iconPath = new vscode.ThemeIcon('terminal');
        
        // Add description with root path and lifecycle events
        const rootPathName = this.getProjectNameFromPath(collection.rootPath);
        const lifecycleText = collection.lifecycle.length > 0 
          ? `(${collection.lifecycle.join(', ')})` 
          : '';
        item.description = `${rootPathName} ${lifecycleText}`.trim();
        
        // Make clickable for popover
        item.command = {
          command: "codestate.terminalCollection.showPopover",
          title: "Show Terminal Collection Popover",
          arguments: [collection],
        };
        
        // Store collection data directly in the item for tree expansion
        (item as any).collectionData = collection;
        
        return item;
      });
    } catch (error) {
      console.error('Error getting all terminal collections:', error);
      return [];
    }
  }



  private getScriptsForCollection(collection: TerminalCollectionWithScripts): vscode.TreeItem[] {
    try {
      if (!collection.scripts || collection.scripts.length === 0) {
        const noScriptsItem = new vscode.TreeItem('No scripts in collection');
        noScriptsItem.contextValue = 'noScripts';
        noScriptsItem.iconPath = new vscode.ThemeIcon('info');
        return [noScriptsItem];
      }

    // Sort scripts by priority
    const sortedScripts = [...collection.scripts].sort((a, b) => {
      const aPriority = a.commands?.[0]?.priority || 0;
      const bPriority = b.commands?.[0]?.priority || 0;
      return aPriority - bPriority;
    });

    return sortedScripts.map(script => {
      const item = new vscode.TreeItem(script.name);
      
      item.tooltip = this.formatScriptTooltip(script);
      item.contextValue = 'script';
      item.iconPath = new vscode.ThemeIcon('symbol-method');
      
      // Add description with command info
      const commandText = script.commands?.[0]?.command || script.script || '';
      const truncatedCommand = commandText.length > 50 
        ? commandText.substring(0, 50) + '...' 
        : commandText;
      item.description = truncatedCommand;
      
      // Make clickable for popover
      item.command = {
        command: "codestate.script.showPopover",
        title: "Show Script Popover",
        arguments: [script],
      };
      
      return item;
    });
    } catch (error) {
      console.error('Error getting scripts for collection:', error);
      const errorItem = new vscode.TreeItem('Error loading scripts');
      errorItem.contextValue = 'error';
      errorItem.iconPath = new vscode.ThemeIcon('error');
      return [errorItem];
    }
  }

  private formatScriptTooltip(script: any): string {
    const lines: string[] = [];
    
    // Basic info
    lines.push(`Script: ${script.name}`);
    lines.push(`Project: ${this.getProjectNameFromPath(script.rootPath)}`);
    
    // Commands info
    if (script.commands && script.commands.length > 0) {
      lines.push(`Commands: ${script.commands.length}`);
      
      // Sort commands by priority
      const sortedCommands = [...script.commands].sort((a: any, b: any) => a.priority - b.priority);
      
      sortedCommands.forEach((command: any, index: number) => {
        const priorityText = command.priority > 0 ? ` (Priority: ${command.priority})` : '';
        const truncatedCommand = command.command.length > 50 
          ? command.command.substring(0, 50) + '...' 
          : command.command;
        lines.push(`  ${index + 1}. ${command.name}: ${truncatedCommand}${priorityText}`);
      });
    } else if (script.script) {
      lines.push(`Command: ${script.script}`);
    } else {
      lines.push('Command: No command specified');
    }
    
    // Lifecycle events
    if (script.lifecycle && script.lifecycle.length > 0) {
      lines.push(`Lifecycle: ${script.lifecycle.join(', ')}`);
    } else {
      lines.push('Lifecycle: none');
    }
    
    // Execution mode
    if (script.executionMode) {
      lines.push(`Execution: ${script.executionMode}`);
    }
    
    // Terminal settings
    if (script.closeTerminalAfterExecution !== undefined) {
      lines.push(`Close Terminal: ${script.closeTerminalAfterExecution ? 'Yes' : 'No'}`);
    }
    
    return lines.join('\n');
  }

  private formatTerminalCollectionTooltip(collection: TerminalCollectionWithScripts): string {
    const lines: string[] = [];
    
    // Basic info
    lines.push(`Name: ${collection.name}`);
    lines.push(`Project: ${this.getProjectNameFromPath(collection.rootPath)}`);
    // lines.push(`Root Path: ${collection.rootPath}`);
    
    // Lifecycle events
    if (collection.lifecycle && collection.lifecycle.length > 0) {
      lines.push(`Lifecycle: ${collection.lifecycle.join(', ')}`);
    } else {
      lines.push('Lifecycle: none');
    }
    
    // Scripts info
    if (collection.scripts && collection.scripts.length > 0) {
      lines.push(`Scripts: ${collection.scripts.length}`);
      
      // Show first few scripts with their commands
      const scriptsToShow = collection.scripts.slice(0, 3); // Show first 3 scripts
      scriptsToShow.forEach((script, index) => {
        const commandText = script.commands?.[0]?.command || script.script || 'No command';
        const truncatedCommand = commandText.length > 60 
          ? commandText.substring(0, 60) + '...' 
          : commandText;
        lines.push(`  ${index + 1}. ${script.name}: ${truncatedCommand}`);
      });
      
      if (collection.scripts.length > 3) {
        lines.push(`  ... and ${collection.scripts.length - 3} more scripts`);
      }
    } else {
      lines.push('Scripts: none');
    }
    
    // Terminal settings
    if (collection.closeTerminalAfterExecution !== undefined) {
      lines.push(`Close Terminal: ${collection.closeTerminalAfterExecution ? 'Yes' : 'No'}`);
    }
    
    return lines.join('\n');
  }

  private getProjectNameFromPath(projectPath: string): string {
    const pathParts = projectPath.split('/');
    return pathParts[pathParts.length - 1] || projectPath;
  }

  private getActionItems(): vscode.TreeItem[] {
    const actionItems: vscode.TreeItem[] = [];

    // Only show action items if we have a current workspace
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      actionItems.push(new AddTerminalCollectionTreeItem());
      actionItems.push(new SeparatorTreeItem());
    }

    return actionItems;
  }
}

// Tree item classes for action items
class AddTerminalCollectionTreeItem extends vscode.TreeItem {
  constructor() {
    super("➕ Add Terminal Collection", vscode.TreeItemCollapsibleState.None);

    this.contextValue = "action";
    this.tooltip = "Create a new terminal collection";
    this.iconPath = undefined;

    this.command = {
      command: "codestate.createTerminalCollection",
      title: "Add Terminal Collection",
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