import * as vscode from 'vscode';
import { SessionsTreeDataProvider } from './SessionsTreeDataProvider';
import { SessionPopoverProvider } from './SessionPopoverProvider';
import { ScriptPopoverProvider } from './ScriptPopoverProvider';
import { SessionCommand } from '../commands/SessionCommand';
import { ListSessionsCommand } from '../commands/ListSessionsCommand';
import { Script, Session } from '@codestate/core';

export class SessionsTreeViewProvider {
  private treeDataProvider: SessionsTreeDataProvider;
  private treeView: vscode.TreeView<vscode.TreeItem>;
  private sessionPopoverProvider: SessionPopoverProvider;
  private scriptPopoverProvider: ScriptPopoverProvider;

  constructor(context: vscode.ExtensionContext) {
    this.treeDataProvider = new SessionsTreeDataProvider();
    this.sessionPopoverProvider = new SessionPopoverProvider();
    this.scriptPopoverProvider = new ScriptPopoverProvider();
    
    // Set refresh callbacks
    this.sessionPopoverProvider.setRefreshCallback(() => this.treeDataProvider.refresh());
    this.scriptPopoverProvider.setRefreshCallback(() => this.treeDataProvider.refresh());
    
    // Register the tree view
    this.treeView = vscode.window.createTreeView('codestate.sessionsView', {
      treeDataProvider: this.treeDataProvider,
      showCollapseAll: true
    });

    // Register popover commands
    this.registerPopoverCommands(context);
    
    // Register context menu refresh command
    const contextMenuDisposable = vscode.commands.registerCommand('codestate.sessions.refresh', async () => {
      console.log('Context menu refresh triggered');
      await this.treeDataProvider.refreshCacheAndView();
    });
    
    context.subscriptions.push(contextMenuDisposable);
  }

  // Method to highlight and expand to show a newly created item
  async highlightNewItem(itemId: string, itemType: 'script' | 'session'): Promise<void> {
    try {
      // First refresh the tree data
      await this.treeDataProvider.refreshCacheAndView();
      
      // Highlight the item
      this.treeDataProvider.highlightNewItem(itemId, itemType);
      
      // Expand the tree view to show the item
      await this.expandToItem(itemId, itemType);
      
      // Ensure the view is visible
      await vscode.commands.executeCommand('codestate.sessionsView.focus');
      
    } catch (error) {
      console.error('Error highlighting new item:', error);
    }
  }

  // Method to expand the tree view to show a specific item
  private async expandToItem(itemId: string, itemType: 'script' | 'session'): Promise<void> {
    try {
      // Get all tree items
      const rootItems = await this.treeDataProvider.getChildren();
      
      for (const projectItem of rootItems) {
        // Check if it's a project item by looking for resourceUri and contextValue
        if (projectItem.resourceUri && projectItem.contextValue === 'project') {
          // First expand the project item
          await this.treeView.reveal(projectItem, { expand: true });
          
          const projectChildren = await this.treeDataProvider.getChildren(projectItem);
          
          for (const groupItem of projectChildren) {
            if (groupItem.contextValue === 'scripts' && itemType === 'script') {
              // Expand scripts group
              await this.treeView.reveal(groupItem, { expand: true });
              
              // Get and expand individual scripts
              const scripts = await this.treeDataProvider.getChildren(groupItem);
              for (const scriptItem of scripts) {
                // Check if this is a script item by looking for the script property
                if (scriptItem.contextValue === 'script' && 
                    'script' in scriptItem && 
                    (scriptItem as any).script?.id === itemId) {
                  // Expand to show this script
                  await this.treeView.reveal(scriptItem, { expand: false, select: true, focus: true });
                  return;
                }
              }
            } else if (groupItem.contextValue === 'sessions' && itemType === 'session') {
              // Expand sessions group
              await this.treeView.reveal(groupItem, { expand: true });
              
              // Get and expand individual sessions
              const sessions = await this.treeDataProvider.getChildren(groupItem);
              for (const sessionItem of sessions) {
                // Check if this is a session item by looking for the session property
                if (sessionItem.contextValue === 'session' && 
                    'session' in sessionItem && 
                    (sessionItem as any).session?.id === itemId) {
                  // Expand to show this session
                  await this.treeView.reveal(sessionItem, { expand: false, select: true, focus: true });
                  return;
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error expanding to item:', error);
    }
  }

  private registerPopoverCommands(context: vscode.ExtensionContext): void {

    // Session popover command
    context.subscriptions.push(
      vscode.commands.registerCommand('codestate.session.showPopover', async (session: any) => {
        await this.sessionPopoverProvider.showSessionPopover(session, new vscode.Position(0, 0));
      })
    );

    // Script popover command
    context.subscriptions.push(
      vscode.commands.registerCommand('codestate.script.showPopover', async (script: any) => {
        await this.scriptPopoverProvider.showScriptPopover(script, new vscode.Position(0, 0));
      })
    );

    // File context menu (keep these for now)
    context.subscriptions.push(
      vscode.commands.registerCommand('codestate.file.open', async (item: vscode.TreeItem) => {
        if (item.resourceUri) {
          const document = await vscode.workspace.openTextDocument(item.resourceUri);
          await vscode.window.showTextDocument(document);
        }
      })
    );

    context.subscriptions.push(
      vscode.commands.registerCommand('codestate.file.copyPath', async (item: vscode.TreeItem) => {
        if (item.resourceUri) {
          await vscode.env.clipboard.writeText(item.resourceUri.fsPath);
          vscode.window.showInformationMessage('File path copied to clipboard');
        }
      })
    );

    context.subscriptions.push(
      vscode.commands.registerCommand('codestate.file.removeFromSession', async (item: vscode.TreeItem) => {
        // TODO: Implement file removal from session
        vscode.window.showInformationMessage('File removal from session not implemented yet');
      })
    );

    // Refresh command
    context.subscriptions.push(
      vscode.commands.registerCommand('codestate.refreshSessions', async () => {
        console.log('Manual refresh triggered');
        await this.treeDataProvider.refreshCacheAndView();
      })
    );
  }

  refresh(): void {
    this.treeDataProvider.refresh();
  }

  closePopovers(): void {
    this.sessionPopoverProvider.closePopover();
    this.scriptPopoverProvider.closePopover();
  }
}
