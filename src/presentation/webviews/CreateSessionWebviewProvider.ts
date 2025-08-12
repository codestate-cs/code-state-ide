import * as vscode from 'vscode';
import { ErrorHandler } from '../../shared/errors/ErrorHandler';
import { ExtensionError, ErrorContext } from '../../shared/errors/ExtensionError';

export class CreateSessionWebviewProvider {
  private static readonly viewType = 'codestate.createSession';
  private panel: vscode.WebviewPanel | undefined;
  private errorHandler: ErrorHandler;

  constructor() {
    this.errorHandler = ErrorHandler.getInstance();
  }

  async show(): Promise<void> {
    // Create and show panel
    this.panel = vscode.window.createWebviewPanel(
      CreateSessionWebviewProvider.viewType,
      'Create New Session',
      {
        viewColumn: vscode.ViewColumn.One,
        preserveFocus: true
      },
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: []
      }
    );

    // Set the webview's initial html content
    this.panel.webview.html = this.getWebviewContent();

    // Handle messages from the webview
    this.panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'createSession':
            await this.handleCreateSession(message.sessionData);
            break;
          case 'cancel':
            this.panel?.dispose();
            break;
          case 'refreshFiles':
            this.refreshWebview();
            break;
        }
      }
    );

    // Handle panel disposal
    this.panel.onDidDispose(() => {
      this.panel = undefined;
    });
  }

  private async handleCreateSession(sessionData: any): Promise<void> {
    try {
      // Close the panel first
      this.panel?.dispose();

      // Use the existing SaveSessionCommand with the data from the webview
      // We need to pass the data through a different mechanism since we can't pass parameters to commands directly
      // For now, let's store the data temporarily and modify the command to check for it
      (globalThis as any).__tempSessionData = {
        name: sessionData.name,
        notes: sessionData.notes,
        tags: sessionData.tags ? sessionData.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0) : []
      };
      
      await vscode.commands.executeCommand('codestate.saveSession');
      
      // Clean up
      delete (globalThis as any).__tempSessionData;

    } catch (error) {
      const extensionError = error instanceof ExtensionError ? error : ExtensionError.fromError(
        error instanceof Error ? error : new Error(String(error)),
        undefined,
        ErrorContext.SESSION_MANAGEMENT
      );
      
      this.errorHandler.handleError(extensionError, ErrorContext.SESSION_MANAGEMENT, true);
      
      vscode.window.showErrorMessage(
        'Failed to create session. Check the output panel for details.',
        'Show Details',
        'Dismiss'
      ).then(selection => {
        if (selection === 'Show Details') {
          this.errorHandler.showOutputChannel();
        }
      });
    }
  }

  private refreshWebview(): void {
    if (this.panel) {
      this.panel.webview.html = this.getWebviewContent();
    }
  }

  private getOpenedFiles(): string[] {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return [];
    }
    
    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    const documentsToShow = new Set<string>();
    
    // Method 1: Get files from visible editors (most reliable for "opened" files)
    const visibleEditors = vscode.window.visibleTextEditors;
    console.log(`Debug: Visible editors: ${visibleEditors.length}`);
    
    visibleEditors.forEach(editor => {
      console.log(`Debug: Processing visible editor: ${editor.document.fileName}`);
      if (editor.document.uri.scheme === 'file' && !editor.document.isUntitled) {
        if (editor.document.fileName.startsWith(workspaceRoot)) {
          const relativePath = editor.document.fileName.replace(workspaceRoot, '').replace(/^[\\\/]/, '');
          documentsToShow.add(relativePath);
          console.log(`Debug: Added visible editor: ${relativePath}`);
        }
      }
    });
    
    // Method 2: Get files from tab groups (backup method)
    try {
      const activeEditorGroups = vscode.window.tabGroups?.all || [];
      console.log(`Debug: Active editor groups: ${activeEditorGroups.length}`);
      
      activeEditorGroups.forEach(group => {
        group.tabs.forEach(tab => {
          if (tab.input && typeof tab.input === 'object' && 'uri' in tab.input) {
            const uri = (tab.input as any).uri;
            if (uri && uri.scheme === 'file') {
              const fileName = uri.fsPath;
              console.log(`Debug: Processing tab: ${fileName}`);
              if (fileName.startsWith(workspaceRoot)) {
                const relativePath = fileName.replace(workspaceRoot, '').replace(/^[\\\/]/, '');
                documentsToShow.add(relativePath);
                console.log(`Debug: Added tab: ${relativePath}`);
              }
            }
          }
        });
      });
    } catch (error) {
      console.log(`Debug: Error getting tabs: ${error}`);
    }
    
    // Convert set to array and sort
    const result = Array.from(documentsToShow).sort();
    console.log(`Debug: Final opened files count: ${result.length}`);
    console.log(`Debug: Files: ${result.join(', ')}`);
    
    return result;
  }



  private getWebviewContent(): string {
    // Get opened files for display
    const openedFiles = this.getOpenedFiles();
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Create New Session</title>
        <style>
          body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            margin: 0;
            padding: 0;
            line-height: 1.6;
            height: 100vh;
            overflow: hidden;
          }

          .container {
            height: 100vh;
            display: flex;
            flex-direction: column;
            background-color: var(--vscode-panel-background);
          }

          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 20px 15px 20px;
            border-bottom: 1px solid var(--vscode-panel-border);
            background-color: var(--vscode-panel-background);
            flex-shrink: 0;
          }

          .header h1 {
            margin: 0;
            color: var(--vscode-editor-foreground);
            font-size: 1.5em;
          }

          .subtitle {
            margin-top: 4px;
            font-size: 0.85em;
            color: var(--vscode-descriptionForeground);
            font-style: italic;
          }

          .form-container {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            scrollbar-width: thin;
            scrollbar-color: var(--vscode-scrollbarSlider-background) transparent;
            display: flex;
            gap: 20px;
          }

          .form-container::-webkit-scrollbar {
            width: 8px;
          }

          .form-container::-webkit-scrollbar-track {
            background: transparent;
          }

          .form-container::-webkit-scrollbar-thumb {
            background-color: var(--vscode-scrollbarSlider-background);
            border-radius: 4px;
          }

          .form-container::-webkit-scrollbar-thumb:hover {
            background-color: var(--vscode-scrollbarSlider-hoverBackground);
          }

          .left-column {
            flex: 1;
            min-width: 0;
          }

          .right-column {
            width: 300px;
            flex-shrink: 0;
          }

          .section {
            margin-bottom: 25px;
            padding: 15px;
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
          }

          .section h2 {
            margin: 0 0 15px 0;
            color: var(--vscode-editor-foreground);
            font-size: 1.2em;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .form-group {
            margin-bottom: 15px;
          }

          .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
            color: var(--vscode-editor-foreground);
          }

          .form-group input[type="text"],
          .form-group textarea {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            font-family: inherit;
            font-size: inherit;
            box-sizing: border-box;
          }

          .form-group textarea {
            resize: vertical;
            min-height: 80px;
          }

          .form-group input:focus,
          .form-group textarea:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
          }

          .buttons {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            padding: 20px;
            border-top: 1px solid var(--vscode-panel-border);
            background-color: var(--vscode-panel-background);
            flex-shrink: 0;
          }

          .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            font-family: inherit;
            font-size: inherit;
            cursor: pointer;
            transition: background-color 0.2s;
          }

          .btn-primary {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
          }

          .btn-primary:hover {
            background-color: var(--vscode-button-hoverBackground);
          }

          .btn-secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
          }

          .btn-secondary:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
          }

          .description {
            font-size: 0.9em;
            color: var(--vscode-descriptionForeground);
            margin-top: 5px;
          }

          .error {
            color: var(--vscode-errorForeground);
            font-size: 0.9em;
            margin-top: 5px;
            display: none;
          }

          .opened-files {
            margin-top: 10px;
          }

          .opened-files ul {
            list-style: none;
            padding: 0;
            margin: 0;
          }

          .opened-files li {
            padding: 4px 8px;
            margin: 2px 0;
            background-color: var(--vscode-list-hoverBackground);
            border-radius: 3px;
            font-family: var(--vscode-editor-font-family);
            font-size: 0.9em;
            color: var(--vscode-editor-foreground);
            word-break: break-all;
          }

          .no-files {
            color: var(--vscode-descriptionForeground);
            font-style: italic;
            text-align: center;
            padding: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div>
              <h1>📄 Create New Session</h1>
              <div class="subtitle">Saves open files, cursor positions and git state.</div>
            </div>
          </div>

          <div class="form-container">
                         <div class="left-column">
               <form id="sessionForm">
                 <!-- Session Details Section -->
                 <div class="section">
                   <h2>🎯 Session Details</h2>
                   
                   <div class="form-group">
                     <label for="name">Session Name *</label>
                     <input type="text" id="name" name="name" required placeholder="e.g., Feature Implementation, Bug Fix, Setup">
                     <div class="description">A descriptive name for your session</div>
                     <div class="error" id="nameError">Session name is required</div>
                   </div>

                   <div class="form-group">
                     <label for="notes">Notes</label>
                     <textarea id="notes" name="notes" placeholder="Optional notes about this session..."></textarea>
                     <div class="description">Additional context or description for this session</div>
                   </div>

                   <div class="form-group">
                     <label for="tags">Tags</label>
                     <input type="text" id="tags" name="tags" placeholder="feature, bugfix, setup (comma-separated)">
                     <div class="description">Tags to help organize and find your sessions</div>
                   </div>
                 </div>
               </form>
             </div>

             <div class="right-column">
               <div class="section">
                  <h2>📂 Opened Files</h2>
                  <div class="opened-files">
                    ${openedFiles.length > 0 ? 
                      `<ul>${openedFiles.map(file => `<li>${file}</li>`).join('')}</ul>` : 
                      '<div class="no-files">No files are currently open</div>'
                    }
                  </div>
                  <button type="button" class="btn btn-secondary" onclick="refreshFiles()" style="margin-top: 10px; width: 100%;">🔄 Refresh File List</button>
                </div>
             </div>
          </div>

          <div class="buttons">
            <button type="button" class="btn btn-secondary" onclick="cancel()">Cancel</button>
            <button type="submit" class="btn btn-primary" onclick="createSession()">Create Session</button>
          </div>
        </div>

        <script>
          const vscode = acquireVsCodeApi();

          // Handle form submission
          document.getElementById('sessionForm').addEventListener('submit', function(e) {
            e.preventDefault();
            createSession();
          });

          function createSession() {
            const name = document.getElementById('name').value.trim();
            const notes = document.getElementById('notes').value.trim();
            const tags = document.getElementById('tags').value.trim();

            // Validate required fields
            if (!name) {
              document.getElementById('nameError').style.display = 'block';
              document.getElementById('name').focus();
              return;
            }

            document.getElementById('nameError').style.display = 'none';

            const sessionData = {
              name: name,
              notes: notes || '',
              tags: tags || ''
            };

            vscode.postMessage({
              command: 'createSession',
              sessionData: sessionData
            });
          }

          function cancel() {
            vscode.postMessage({
              command: 'cancel'
            });
          }

          function refreshFiles() {
            vscode.postMessage({
              command: 'refreshFiles'
            });
          }

          // Focus on name field when page loads
          document.addEventListener('DOMContentLoaded', function() {
            document.getElementById('name').focus();
          });
        </script>
      </body>
      </html>
    `;
  }
}
