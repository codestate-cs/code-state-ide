import * as vscode from 'vscode';
import { Script, DeleteScript, UpdateScript, ResumeScript } from '@codestate/core';
import { PopoverAction } from './SessionPopoverProvider';
import { CreateScriptWebviewProvider } from '../webviews/CreateScriptWebviewProvider';

export class ScriptPopoverProvider {
  private currentPopover: vscode.StatusBarItem | undefined;
  private currentScript: Script | undefined;
  private onRefresh?: () => void;
  private createScriptWebviewProvider: CreateScriptWebviewProvider;

  constructor() {
    this.createScriptWebviewProvider = new CreateScriptWebviewProvider();
  }

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
      // Use ResumeScript from @codestate/core to handle script execution
      const resumeScript = new ResumeScript();
      const result = await resumeScript.execute(script.id);
      
      if (!result.ok) {
        vscode.window.showErrorMessage(`Failed to execute script: ${result.error.message}`);
        return;
      }
      
      vscode.window.showInformationMessage(`Script "${script.name}" executed successfully!`);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to execute script: ${error}`);
    }
  }

  private async copyScriptCommand(script: Script): Promise<void> {
    try {
      // Copy the first command or the legacy script field
      const commandToCopy = script.commands && script.commands.length > 0 
        ? script.commands[0].command 
        : (script.script || '');
        
      if (!commandToCopy || commandToCopy.trim().length === 0) {
        vscode.window.showWarningMessage('No command found to copy');
        return;
      }
        
      await vscode.env.clipboard.writeText(commandToCopy);
      vscode.window.showInformationMessage('Script command copied to clipboard');
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to copy script: ${error}`);
    }
  }

  private async editScript(script: Script): Promise<void> {
    try {
      // Transform the script data to match the expected format for the webview
      const scriptData = {
        name: script.name,
        rootPath: script.rootPath,
        script: script.script || '',
        commands: script.commands && script.commands.length > 0 ? script.commands : [{
          command: script.script || '',
          name: script.name,
          priority: 1
        }],
        lifecycle: script.lifecycle || ['none'],
        executionMode: script.executionMode || 'new-terminals',
        closeTerminalAfterExecution: script.closeTerminalAfterExecution || false
      };

      // Show the update webview
      await this.createScriptWebviewProvider.showUpdate(scriptData);
      
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to open script editor: ${error}`);
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

          // Delete the script using DeleteScript from @codestate/core
          const deleteScript = new DeleteScript();
          const result = await deleteScript.execute(script.id);

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
