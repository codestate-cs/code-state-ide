import * as vscode from 'vscode';
import { ListSessions } from 'codestate-core';
import { ErrorHandler } from '../../shared/errors/ErrorHandler';

export class StatusBarProvider {
  private statusBarItem: vscode.StatusBarItem;
  private errorHandler: ErrorHandler;

  constructor() {
    this.errorHandler = ErrorHandler.getInstance();
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.statusBarItem.name = 'CodeState Sessions';
    this.statusBarItem.tooltip = 'Click to view sessions';
    this.statusBarItem.command = 'codestate.listSessions';
  }

  async updateSessionCount(): Promise<void> {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        this.statusBarItem.hide();
        return;
      }

      const projectRoot = workspaceFolders[0].uri.fsPath;
      
      // Get session count for current project
      const listSessions = new ListSessions();
      const result = await listSessions.execute({
        search: projectRoot
      });

      if (result.ok) {
        const sessions = result.value.filter(session => 
          session.projectRoot === projectRoot
        );
        
        this.statusBarItem.text = `$(book) ${sessions.length} session${sessions.length !== 1 ? 's' : ''}`;
        this.statusBarItem.show();
      } else {
        this.statusBarItem.text = '$(error) Sessions error';
        this.statusBarItem.show();
      }
    } catch (error) {
      // Don't show error in status bar, just hide it
      this.statusBarItem.hide();
    }
  }

  show(): void {
    this.statusBarItem.show();
  }

  hide(): void {
    this.statusBarItem.hide();
  }

  dispose(): void {
    this.statusBarItem.dispose();
  }
}
