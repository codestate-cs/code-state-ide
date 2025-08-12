import * as vscode from 'vscode';
import { Script, DeleteScript, UpdateScript } from 'codestate-core';
import { PopoverAction } from './SessionPopoverProvider';

export class ScriptPopoverProvider {
  private currentPopover: vscode.StatusBarItem | undefined;
  private currentScript: Script | undefined;
  private onRefresh?: () => void;

  setRefreshCallback(callback: () => void): void {
    this.onRefresh = callback;
  }

  async showScriptPopover(script: Script, position: vscode.Position): Promise<void> {
    // Close existing popover if any
    this.closePopover();

    this.currentScript = script;

    // Show quick pick menu as popover
    const actions: PopoverAction[] = [
      {
        id: 'execute',
        label: '▶️ Execute Script',
        icon: '▶️',
        action: async () => {
          await this.executeScript(script);
        }
      },
      {
        id: 'copy',
        label: '📋 Copy Command',
        icon: '📋',
        action: async () => {
          await this.copyScriptCommand(script);
        }
      },
      {
        id: 'edit',
        label: '✏️ Edit Script',
        icon: '✏️',
        action: async () => {
          await this.editScript(script);
        }
      },
      {
        id: 'delete',
        label: '🗑️ Remove Script',
        icon: '🗑️',
        action: async () => {
          await this.deleteScript(script);
        }
      }
    ];

    const selectedAction = await vscode.window.showQuickPick(
      actions.map(action => action.label),
      {
        placeHolder: `Script: ${script.name} - Select an action`,
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



  private async executeScript(script: Script): Promise<void> {
    try {
      // Create a new terminal and execute the script
      const terminal = vscode.window.createTerminal({
        name: `CodeState: ${script.name}`,
        cwd: script.rootPath
      });

      terminal.show();
      terminal.sendText(script.script);

      vscode.window.showInformationMessage(`Executing script: ${script.name}`);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to execute script: ${error}`);
    }
  }

  private async copyScriptCommand(script: Script): Promise<void> {
    try {
      await vscode.env.clipboard.writeText(script.script);
      vscode.window.showInformationMessage('Script command copied to clipboard');
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to copy script: ${error}`);
    }
  }

  private async editScript(script: Script): Promise<void> {
    const newScript = await vscode.window.showInputBox({
      prompt: 'Edit script command',
      value: script.script,
      placeHolder: 'Enter the command to execute...'
    });

    if (newScript !== undefined) {
      try {
        // Show progress
        await vscode.window.withProgress({
          location: vscode.ProgressLocation.Notification,
          title: `Updating script: ${script.name}`,
          cancellable: false
        }, async (progress) => {
          progress.report({ message: 'Updating script...', increment: 50 });

          // Update the script using UpdateScript from codestate-core
          const updateScript = new UpdateScript();
          const result = await updateScript.execute(script.name, script.rootPath, {
            script: newScript
          });

          if (!result.ok) {
            throw new Error(`Failed to update script: ${result.error.message}`);
          }

          progress.report({ message: 'Script updated successfully!', increment: 50 });
        });

        vscode.window.showInformationMessage(`Script "${script.name}" updated successfully!`);
        this.onRefresh?.();
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to update script: ${error}`);
      }
    }
  }

  private async deleteScript(script: Script): Promise<void> {
    const confirm = await vscode.window.showWarningMessage(
      `Remove script "${script.name}"?`,
      'Remove',
      'Cancel'
    );

    if (confirm === 'Remove') {
      try {
        // Show progress
        await vscode.window.withProgress({
          location: vscode.ProgressLocation.Notification,
          title: `Deleting script: ${script.name}`,
          cancellable: false
        }, async (progress) => {
          progress.report({ message: 'Deleting script...', increment: 50 });

          // Delete the script using DeleteScript from codestate-core
          const deleteScript = new DeleteScript();
          const result = await deleteScript.execute(script.name, script.rootPath);

          if (!result.ok) {
            throw new Error(`Failed to delete script: ${result.error.message}`);
          }

          progress.report({ message: 'Script deleted successfully!', increment: 50 });
        });

        vscode.window.showInformationMessage(`Script "${script.name}" deleted successfully!`);
        this.onRefresh?.();
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to delete script: ${error}`);
      }
    }
  }

  closePopover(): void {
    this.currentPopover = undefined;
    this.currentScript = undefined;
  }

  isPopoverOpen(): boolean {
    return this.currentPopover !== undefined;
  }
}
