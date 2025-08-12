import * as vscode from 'vscode';
import { SessionsTreeDataProvider } from './SessionsTreeDataProvider';
import { SessionPopoverProvider } from './SessionPopoverProvider';
import { ScriptPopoverProvider } from './ScriptPopoverProvider';
import { SaveSessionCommand } from '../commands/SaveSessionCommand';
import { ListSessionsCommand } from '../commands/ListSessionsCommand';

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
    const contextMenuDisposable = vscode.commands.registerCommand('codestate.sessions.refresh', () => {
      console.log('Context menu refresh triggered');
      this.treeDataProvider.refresh();
    });
    
    context.subscriptions.push(contextMenuDisposable);
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
      vscode.commands.registerCommand('codestate.refreshSessions', () => {
        console.log('Manual refresh triggered');
        this.treeDataProvider.refresh();
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
