import { Result } from '@codestate/core';
import { GitValidationService, GitValidationResult } from './GitValidationService';
import { FileSystemService, FileSystemState } from './FileSystemService';

export interface SessionCreationData {
  name: string;
  projectRoot: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  notes?: string;
  files: FileSystemState['files'];
  git: GitValidationResult['gitState'];
  extensions?: Record<string, unknown>;
  terminalCommands?: any[];
  terminalCollections?: string[];
  scripts?: string[];
}

export class SessionDataCollector {
  private gitValidationService: GitValidationService;
  private fileSystemService: FileSystemService;

  constructor() {
    this.gitValidationService = new GitValidationService();
    this.fileSystemService = new FileSystemService();
  }

  /**
   * Collects all necessary data for session creation
   * @param projectRoot - The project root directory
   * @returns Promise<Result<SessionCreationData>>
   */
  async collectSessionData(projectRoot: string): Promise<Result<SessionCreationData>> {
    try {
      // Validate and handle git state
      const gitResult = await this.gitValidationService.validateAndHandleGitState(projectRoot);
      if (!gitResult.ok) {
        return {
          ok: false,
          error: new Error(`Git validation failed: ${gitResult.error.message}`)
        };
      }

      // Gather file system state
      const fileSystemResult = await this.fileSystemService.gatherFileSystemState(projectRoot);
      if (!fileSystemResult.ok) {
        return {
          ok: false,
          error: new Error(`File system gathering failed: ${fileSystemResult.error.message}`)
        };
      }

      // Create session data
      const sessionData: SessionCreationData = {
        name: '', // Will be filled by user in the UI
        projectRoot,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [], // Will be filled by user in the UI
        notes: '', // Will be filled by user in the UI
        files: fileSystemResult.value.files,
        git: gitResult.value.gitState,
        extensions: this.gatherExtensionData(),
        terminalCommands: [], // TODO: Implement terminal command gathering
        terminalCollections: [], // TODO: Implement terminal collection gathering
        scripts: [] // TODO: Implement script gathering
      };

      return {
        ok: true,
        value: sessionData
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error : new Error('Unknown error occurred during session data collection')
      };
    }
  }

  /**
   * Gathers extension-specific data
   */
  private gatherExtensionData(): Record<string, unknown> {
    try {
      // Get VS Code configuration
      const config = {
        theme: this.getCurrentTheme(),
        language: this.getCurrentLanguage(),
        extensions: this.getActiveExtensions()
      };

      return {
        vscode: config
      };
    } catch (error) {
      return {};
    }
  }

  /**
   * Gets current VS Code theme
   */
  private getCurrentTheme(): string {
    try {
      const config = require('vscode').workspace.getConfiguration('workbench');
      return config.get('colorTheme') || 'default';
    } catch {
      return 'default';
    }
  }

  /**
   * Gets current language
   */
  private getCurrentLanguage(): string {
    try {
      const activeEditor = require('vscode').window.activeTextEditor;
      if (activeEditor) {
        return activeEditor.document.languageId;
      }
      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Gets active extensions
   */
  private getActiveExtensions(): string[] {
    try {
      const extensions = require('vscode').extensions.all
        .filter((ext: any) => ext.isActive)
        .map((ext: any) => ext.id);
      return extensions;
    } catch {
      return [];
    }
  }
}