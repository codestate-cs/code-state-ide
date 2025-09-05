import * as vscode from 'vscode';
import { TerminalsTreeDataProvider } from './TerminalsTreeDataProvider';
import { TerminalCollectionPopoverProvider } from './TerminalCollectionPopoverProvider';
import { ScriptPopoverProvider } from './ScriptPopoverProvider';
import { TerminalCollectionWithScripts } from '@codestate/core';

export class TerminalsTreeViewProvider {
  private treeDataProvider: TerminalsTreeDataProvider;
  private treeView: vscode.TreeView<vscode.TreeItem>;
  private terminalCollectionPopoverProvider: TerminalCollectionPopoverProvider;
  private scriptPopoverProvider: ScriptPopoverProvider;

  constructor(context: vscode.ExtensionContext) {
    this.treeDataProvider = new TerminalsTreeDataProvider();
    this.terminalCollectionPopoverProvider = new TerminalCollectionPopoverProvider();
    this.scriptPopoverProvider = new ScriptPopoverProvider();
    
    // Set refresh callbacks
    this.terminalCollectionPopoverProvider.setRefreshCallback(() => this.treeDataProvider.refresh());
    this.scriptPopoverProvider.setRefreshCallback(() => this.treeDataProvider.refresh());
    
    // Register the tree view
    this.treeView = vscode.window.createTreeView('codestate.terminalsView', {
      treeDataProvider: this.treeDataProvider,
      showCollapseAll: false
    });

    // Register commands
    this.registerCommands(context);
  }

  private registerCommands(context: vscode.ExtensionContext): void {
    // Terminal collection popover command
    context.subscriptions.push(
      vscode.commands.registerCommand('codestate.terminalCollection.showPopover', async (collection: TerminalCollectionWithScripts) => {
        await this.terminalCollectionPopoverProvider.showTerminalCollectionPopover(collection, new vscode.Position(0, 0));
      })
    );

    // Script popover command
    context.subscriptions.push(
      vscode.commands.registerCommand('codestate.script.showPopover', async (script: any) => {
        await this.scriptPopoverProvider.showScriptPopover(script, new vscode.Position(0, 0));
      })
    );

    // Refresh command
    context.subscriptions.push(
      vscode.commands.registerCommand('codestate.terminals.refresh', async () => {
        console.log('Terminals refresh triggered');
        await this.treeDataProvider.refreshCacheAndView();
      })
    );
  }

  refresh(): void {
    this.treeDataProvider.refresh();
  }

  dispose(): void {
    this.treeDataProvider.dispose();
  }
} 