import * as vscode from 'vscode';
import { Result } from '@codestate/core';

export interface FileSystemState {
  files: Array<{
    path: string;
    cursor?: {
      line: number;
      column: number;
    };
    scroll?: {
      top: number;
      left: number;
    };
    isActive: boolean;
    position?: number;
  }>;
  rootPath: string;
}

export class FileSystemService {
  /**
   * Gathers current file system state from VS Code
   * @param projectRoot - The project root directory
   * @returns Promise<Result<FileSystemState>>
   */
  async gatherFileSystemState(projectRoot: string): Promise<Result<FileSystemState>> {
    try {
      const files: FileSystemState['files'] = [];
      let activeFileIndex = 0;

      // Get all open editors
      const editors = vscode.window.tabGroups.all.flatMap(group => group.tabs);
      
      editors.forEach((tab, index) => {
        if (tab.input instanceof vscode.TabInputText) {
          const filePath = tab.input.uri.fsPath;
          
          // Only include files within the project root
          if (filePath.startsWith(projectRoot)) {
            const relativePath = filePath.replace(projectRoot, '').replace(/^[\/\\]/, '');
            
            // Get cursor position from active editor if this is the active file
            let cursor: { line: number; column: number } | undefined;
            let scroll: { top: number; left: number } | undefined;
            
            if (tab.isActive && vscode.window.activeTextEditor) {
              const activeEditor = vscode.window.activeTextEditor;
              if (activeEditor.document.uri.fsPath === filePath) {
                const position = activeEditor.selection.active;
                cursor = {
                  line: position.line + 1, // Convert to 1-based indexing
                  column: position.character + 1
                };
                
                // Get scroll position
                const visibleRanges = activeEditor.visibleRanges;
                if (visibleRanges.length > 0) {
                  scroll = {
                    top: visibleRanges[0].start.line,
                    left: 0 // VS Code doesn't expose horizontal scroll position easily
                  };
                }
              }
            }

            files.push({
              path: relativePath,
              cursor,
              scroll,
              isActive: tab.isActive,
              position: index
            });

            if (tab.isActive) {
              activeFileIndex = files.length - 1;
            }
          }
        }
      });

      return {
        ok: true,
        value: {
          files,
          rootPath: projectRoot
        }
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error : new Error('Unknown error occurred while gathering file system state')
      };
    }
  }

  /**
   * Gets the current workspace root path
   */
  getWorkspaceRoot(): string | undefined {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      return workspaceFolders[0].uri.fsPath;
    }
    return undefined;
  }

  /**
   * Validates that the given path is within the workspace
   */
  isPathInWorkspace(path: string): boolean {
    const workspaceRoot = this.getWorkspaceRoot();
    if (!workspaceRoot) {
      return false;
    }
    return path.startsWith(workspaceRoot);
  }
}