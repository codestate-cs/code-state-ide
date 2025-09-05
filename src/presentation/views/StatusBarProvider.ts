import * as vscode from 'vscode';
import { ErrorHandler } from '../../shared/errors/ErrorHandler';
import { DataCacheService } from '../../infrastructure/services/DataCacheService';
import { useCacheStore } from '../../shared/stores/cacheStore';

export class StatusBarProvider {
  private statusBarItem: vscode.StatusBarItem;
  private errorHandler: ErrorHandler;
  private dataCacheService: DataCacheService;

  constructor() {
    this.errorHandler = ErrorHandler.getInstance();
    this.dataCacheService = DataCacheService.getInstance();
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
      
      // Get sessions from cache
      await this.dataCacheService.getSessions();
      
      // Get session count for current project from store
      const store = useCacheStore.getState();
      const sessions = store.sessions.filter(session => 
        session.projectRoot === projectRoot
      );
      
      this.statusBarItem.text = `$(book) ${sessions.length} session${sessions.length !== 1 ? 's' : ''}`;
      this.statusBarItem.show();
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
