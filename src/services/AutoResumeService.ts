import * as vscode from 'vscode';
import { CodeStateService } from './CodeStateService';
import { Logger } from '../utils/logger';

export class AutoResumeService {
  private static instance: AutoResumeService;
  private codeStateService: CodeStateService;
  private logger: Logger;

  private constructor() {
    this.codeStateService = CodeStateService.getInstance();
    this.logger = Logger.getInstance('AutoResumeService');
  }

  static getInstance(): AutoResumeService {
    if (!AutoResumeService.instance) {
      AutoResumeService.instance = new AutoResumeService();
    }
    return AutoResumeService.instance;
  }

  /**
   * Auto-resume scripts and terminal collections with 'open' lifecycle for current workspace
   */
  async autoResumeForCurrentWorkspace(): Promise<void> {
    try {
      this.logger.log('Starting auto-resume for current workspace');
      
      // Get current workspace root
      const workspaceRoot = this.getCurrentWorkspaceRoot();
      if (!workspaceRoot) {
        this.logger.log('No workspace root found, skipping auto-resume');
        return;
      }

      this.logger.log(`Auto-resuming for workspace: ${workspaceRoot}`);

      // Get scripts for current workspace with 'open' lifecycle (using service filtering)
      const scriptsResult = await this.codeStateService.getScriptService().getScripts({
        rootPath: workspaceRoot,
        lifecycle: 'open'
      });

      // Get all terminal collections (no filtering available yet)
      const terminalCollectionsResult = await this.codeStateService.getTerminalCollectionService().getTerminalCollections();

      if (!scriptsResult.ok || !terminalCollectionsResult.ok) {
        this.logger.log('Failed to get scripts or terminal collections for auto-resume');
        return;
      }

      const scriptsToResume = scriptsResult.value;
      
      // Filter terminal collections manually (until service supports filtering)
      const terminalCollectionsToResume = terminalCollectionsResult.value.filter(tc => 
        tc.rootPath === workspaceRoot && 
        tc.lifecycle && tc.lifecycle.includes('open')
      );

      this.logger.log(`Found ${scriptsToResume.length} scripts and ${terminalCollectionsToResume.length} terminal collections to resume`);

      // Resume scripts
      for (const script of scriptsToResume) {
        try {
          this.logger.log(`Auto-resuming script: ${script.name}`);
          const result = await this.codeStateService.getScriptService().resumeScript(script.id);
          if (result.ok) {
            this.logger.log(`Successfully auto-resumed script: ${script.name}`);
          } else {
            this.logger.log(`Failed to auto-resume script ${script.name}: ${result.error.message}`);
          }
        } catch (error) {
          this.logger.log(`Error auto-resuming script ${script.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Resume terminal collections
      for (const terminalCollection of terminalCollectionsToResume) {
        try {
          this.logger.log(`Auto-resuming terminal collection: ${terminalCollection.name}`);
          const result = await this.codeStateService.getTerminalCollectionService().executeTerminalCollection(terminalCollection.id);
          if (result.ok) {
            this.logger.log(`Successfully auto-resumed terminal collection: ${terminalCollection.name}`);
          } else {
            this.logger.log(`Failed to auto-resume terminal collection ${terminalCollection.name}: ${result.error.message}`);
          }
        } catch (error) {
          this.logger.log(`Error auto-resuming terminal collection ${terminalCollection.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      this.logger.log('Auto-resume completed');
    } catch (error) {
      this.logger.log(`Auto-resume failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get current workspace root path
   */
  private getCurrentWorkspaceRoot(): string | null {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        return null;
      }
      
      // Use the first workspace folder as the root
      return workspaceFolders[0].uri.fsPath;
    } catch (error) {
      this.logger.log(`Error getting workspace root: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }
}