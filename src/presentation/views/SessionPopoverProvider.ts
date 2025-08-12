import * as vscode from 'vscode';
import { Session, UpdateSession } from 'codestate-core';
import { ResumeSessionCommand } from '../commands/ResumeSessionCommand';
import { DeleteSessionCommand } from '../commands/DeleteSessionCommand';

export interface PopoverAction {
  id: string;
  label: string;
  icon: string;
  action: () => Promise<void>;
}

export class SessionPopoverProvider {
  private currentPopover: vscode.StatusBarItem | undefined;
  private currentSession: Session | undefined;
  private onRefresh?: () => void;

  setRefreshCallback(callback: () => void): void {
    this.onRefresh = callback;
  }

  async showSessionPopover(session: Session, position: vscode.Position): Promise<void> {
    // Close existing popover if any
    this.closePopover();

    this.currentSession = session;

    // Show quick pick menu as popover
    const actions: PopoverAction[] = [
             {
         id: 'resume',
         label: '▶️ Resume Session',
         icon: '▶️',
         action: async () => {
           await ResumeSessionCommand.execute(session);
           this.onRefresh?.();
         }
       },
      {
        id: 'edit-notes',
        label: '✏️ Edit Notes',
        icon: '✏️',
        action: async () => {
          await this.editSessionNotes(session);
        }
      },
      {
        id: 'manage-tags',
        label: '🏷️ Manage Tags',
        icon: '🏷️',
        action: async () => {
          await this.manageSessionTags(session);
        }
      },
      {
        id: 'export',
        label: '📤 Export Session',
        icon: '📤',
        action: async () => {
          await this.exportSession(session);
        }
      },
             {
         id: 'delete',
         label: '🗑️ Delete Session',
         icon: '🗑️',
         action: async () => {
           await DeleteSessionCommand.execute(session);
           this.onRefresh?.();
         }
       }
    ];

    const selectedAction = await vscode.window.showQuickPick(
      actions.map(action => action.label),
      {
        placeHolder: `Session: ${session.name} - Select an action`,
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



  private async editSessionNotes(session: Session): Promise<void> {
    const notes = await vscode.window.showInputBox({
      prompt: 'Edit session notes',
      value: session.notes || '',
      placeHolder: 'Describe what you\'re working on...'
    });

    if (notes !== undefined) {
      try {
        // Show progress
        await vscode.window.withProgress({
          location: vscode.ProgressLocation.Notification,
          title: `Updating session notes: ${session.name}`,
          cancellable: false
        }, async (progress) => {
          progress.report({ message: 'Updating session notes...', increment: 50 });

          // Update the session notes using UpdateSession from codestate-core
          const updateSession = new UpdateSession();
          const result = await updateSession.execute(session.id, {
            notes: notes
          });

          if (!result.ok) {
            throw new Error(`Failed to update session notes: ${result.error.message}`);
          }

          progress.report({ message: 'Session notes updated successfully!', increment: 50 });
        });

        vscode.window.showInformationMessage(`Session notes updated successfully!`);
        this.onRefresh?.();
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to update session notes: ${error}`);
      }
    }
  }

  private async manageSessionTags(session: Session): Promise<void> {
    const tagsInput = await vscode.window.showInputBox({
      prompt: 'Manage session tags (comma-separated)',
      value: session.tags?.join(', ') || '',
      placeHolder: 'feature, auth, frontend'
    });

    if (tagsInput !== undefined) {
      const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      try {
        // Show progress
        await vscode.window.withProgress({
          location: vscode.ProgressLocation.Notification,
          title: `Updating session tags: ${session.name}`,
          cancellable: false
        }, async (progress) => {
          progress.report({ message: 'Updating session tags...', increment: 50 });

          // Update the session tags using UpdateSession from codestate-core
          const updateSession = new UpdateSession();
          const result = await updateSession.execute(session.id, {
            tags: tags
          });

          if (!result.ok) {
            throw new Error(`Failed to update session tags: ${result.error.message}`);
          }

          progress.report({ message: 'Session tags updated successfully!', increment: 50 });
        });

        vscode.window.showInformationMessage(`Session tags updated successfully!`);
        this.onRefresh?.();
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to update session tags: ${error}`);
      }
    }
  }

  private async exportSession(session: Session): Promise<void> {
    // TODO: Implement session export using ExportSession from codestate-core
    vscode.window.showInformationMessage('Session export not implemented yet');
  }

  closePopover(): void {
    this.currentPopover = undefined;
    this.currentSession = undefined;
  }

  isPopoverOpen(): boolean {
    return this.currentPopover !== undefined;
  }
}
