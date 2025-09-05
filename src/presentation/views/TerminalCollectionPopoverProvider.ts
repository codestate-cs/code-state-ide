import * as vscode from 'vscode';
import { TerminalCollectionWithScripts } from '@codestate/core';

export interface PopoverAction {
  id: string;
  label: string;
  icon: string;
  action: () => Promise<void>;
}

export class TerminalCollectionPopoverProvider {
  private currentPopover: vscode.StatusBarItem | undefined;
  private currentCollection: TerminalCollectionWithScripts | undefined;
  private onRefresh?: () => void;

  setRefreshCallback(callback: () => void): void {
    this.onRefresh = callback;
  }

  async showTerminalCollectionPopover(collection: TerminalCollectionWithScripts, position: vscode.Position): Promise<void> {
    // Close existing popover if any
    this.closePopover();

    this.currentCollection = collection;

    // Show quick pick menu as popover
    const actions: PopoverAction[] = [
      {
        id: 'resume',
        label: '▶️ Resume Terminal Collection',
        icon: '▶️',
        action: async () => {
          await this.resumeTerminalCollection(collection);
        }
      },
      {
        id: 'update',
        label: '✏️ Edit Terminal Collection',
        icon: '✏️',
        action: async () => {
          // Get the global webview provider instance
          const globalCreateTerminalCollectionWebviewProvider = (global as any).createTerminalCollectionWebviewProvider;
          if (globalCreateTerminalCollectionWebviewProvider) {
            await globalCreateTerminalCollectionWebviewProvider.showUpdate(collection);
          } else {
            vscode.window.showErrorMessage('Update functionality not available');
          }
        }
      },
      {
        id: 'delete',
        label: '🗑️ Delete Terminal Collection',
        icon: '🗑️',
        action: async () => {
          await this.deleteTerminalCollection(collection);
          this.onRefresh?.();
        }
      }
    ];

    const selectedAction = await vscode.window.showQuickPick(
      actions.map(action => action.label),
      {
        placeHolder: `Terminal Collection: ${collection.name} - Select an action`,
        ignoreFocusOut: false
      }
    );

    if (selectedAction) {
      const action = actions.find(a => a.label === selectedAction);
      if (action) {
        try {
          await action.action();
        } catch (error) {
          vscode.window.showErrorMessage(`Failed to execute ${action.label}: ${error}`);
        }
      }
    }

    this.closePopover();
  }

  private async resumeTerminalCollection(collection: TerminalCollectionWithScripts): Promise<void> {
    try {
      // Execute the terminal collection using ExecuteTerminalCollection from @codestate/core
      const { ExecuteTerminalCollection } = await import('@codestate/core');
      const executeTerminalCollection = new ExecuteTerminalCollection();
      
      const result = await executeTerminalCollection.execute(collection.name, collection.rootPath);
      
      if (result.ok) {
        vscode.window.showInformationMessage(`Terminal collection "${collection.name}" resumed successfully`);
      } else {
        throw new Error(result.error.message);
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to resume terminal collection: ${error}`);
    }
  }

  private async deleteTerminalCollection(collection: TerminalCollectionWithScripts): Promise<void> {
    const confirm = await vscode.window.showWarningMessage(
      `Are you sure you want to delete the terminal collection "${collection.name}"?`,
      { modal: true },
      'Delete',
      'Cancel'
    );

    if (confirm === 'Delete') {
      try {
        // Delete the terminal collection using DeleteTerminalCollection from @codestate/core
        const { DeleteTerminalCollection } = await import('@codestate/core');
        const deleteTerminalCollection = new DeleteTerminalCollection();
        
        const result = await deleteTerminalCollection.execute(collection.id);
        
        if (result.ok) {
          vscode.window.showInformationMessage(`Terminal collection "${collection.name}" deleted successfully`);
        } else {
          throw new Error(result.error.message);
        }
      } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to delete terminal collection: ${error}`);
      }
    }
  }

  closePopover(): void {
    if (this.currentPopover) {
      this.currentPopover.dispose();
      this.currentPopover = undefined;
    }
    this.currentCollection = undefined;
  }

  dispose(): void {
    this.closePopover();
  }
} 