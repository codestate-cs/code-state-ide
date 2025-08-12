import * as vscode from 'vscode';
import { CreateScript } from 'codestate-core';
import { ErrorHandler } from '../../shared/errors/ErrorHandler';
import { ExtensionError, ErrorContext } from '../../shared/errors/ExtensionError';

export class CreateScriptWebviewProvider {
  private static readonly viewType = 'codestate.createScript';
  private panel: vscode.WebviewPanel | undefined;
  private errorHandler: ErrorHandler;

  constructor() {
    this.errorHandler = ErrorHandler.getInstance();
  }

  async show(): Promise<void> {
    // Create and show panel
    this.panel = vscode.window.createWebviewPanel(
      CreateScriptWebviewProvider.viewType,
      'Create New Script',
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
          case 'createScript':
            await this.handleCreateScript(message.scriptData);
            break;
          case 'cancel':
            this.panel?.dispose();
            break;
        }
      }
    );

    // Handle panel disposal
    this.panel.onDidDispose(() => {
      this.panel = undefined;
    });
  }

  private async handleCreateScript(scriptData: any): Promise<void> {
    try {
      // Get current workspace
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        throw new Error('No workspace folder is open');
      }

      const projectRoot = workspaceFolders[0].uri.fsPath;

      // Show progress indicator
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Creating new script...',
          cancellable: false
        },
        async (progress) => {
          progress.report({ increment: 0, message: 'Validating script...' });

          // Create CreateScript instance and execute
          const createScript = new CreateScript();
          const result = await createScript.execute({
            name: scriptData.name,
            script: scriptData.script,
            rootPath: projectRoot
          });

          if (!result.ok) {
            throw new Error(`Failed to create script: ${result.error.message}`);
          }

          progress.report({ increment: 100, message: 'Script created successfully' });
        }
      );

      // Show success message
      vscode.window.showInformationMessage(`Script "${scriptData.name}" created successfully!`);

      // Close the panel
      this.panel?.dispose();

      // Refresh the sessions tree view
      vscode.commands.executeCommand('codestate.refreshSessions');

    } catch (error) {
      const extensionError = error instanceof ExtensionError ? error : ExtensionError.fromError(
        error instanceof Error ? error : new Error(String(error)),
        undefined,
        ErrorContext.SESSION_MANAGEMENT
      );
      
      this.errorHandler.handleError(extensionError, ErrorContext.SESSION_MANAGEMENT, true);
      
      vscode.window.showErrorMessage(
        'Failed to create script. Check the output panel for details.',
        'Show Details',
        'Dismiss'
      ).then(selection => {
        if (selection === 'Show Details') {
          this.errorHandler.showOutputChannel();
        }
      });
    }
  }

  private getWebviewContent(): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Create New Script</title>
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

          .form-container {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            scrollbar-width: thin;
            scrollbar-color: var(--vscode-scrollbarSlider-background) transparent;
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
            min-height: 100px;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
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

          .examples {
            margin-top: 10px;
            padding: 10px;
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 4px;
            font-size: 0.9em;
          }

          .examples h4 {
            margin: 0 0 8px 0;
            color: var(--vscode-editor-foreground);
          }

          .examples ul {
            margin: 0;
            padding-left: 20px;
          }

          .examples li {
            margin-bottom: 4px;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🖥️ Create New Script</h1>
          </div>

          <div class="form-container">
            <form id="scriptForm">
              <!-- Script Details Section -->
              <div class="section">
                <h2>🎯 Script Details</h2>
                
                <div class="form-group">
                  <label for="name">Script Name *</label>
                  <input type="text" id="name" name="name" required placeholder="e.g., Build, Test, Deploy, Setup">
                  <div class="description">A descriptive name for your script</div>
                  <div class="error" id="nameError">Script name is required</div>
                </div>

                <div class="form-group">
                  <label for="script">Script Command *</label>
                  <textarea id="script" name="script" required placeholder="Enter the command to execute..."></textarea>
                  <div class="description">The command that will be executed when this script is run</div>
                  <div class="error" id="scriptError">Script command is required</div>
                </div>
              </div>

              <!-- Examples Section -->
              <div class="section">
                <h2>💡 Common Examples</h2>
                <div class="examples">
                  <h4>Build Scripts:</h4>
                  <ul>
                    <li>npm run build</li>
                    <li>yarn build</li>
                    <li>dotnet build</li>
                    <li>mvn clean install</li>
                  </ul>
                  
                  <h4>Test Scripts:</h4>
                  <ul>
                    <li>npm test</li>
                    <li>yarn test</li>
                    <li>python -m pytest</li>
                    <li>go test ./...</li>
                  </ul>
                  
                  <h4>Development Scripts:</h4>
                  <ul>
                    <li>npm run dev</li>
                    <li>yarn start</li>
                    <li>python manage.py runserver</li>
                    <li>docker-compose up</li>
                  </ul>
                </div>
              </div>

              <!-- Current Project Info -->
              <div class="section">
                <h2>📁 Current Project</h2>
                <div class="description">
                  This script will be associated with your current workspace and can be executed from the Sessions & Scripts view.
                </div>
              </div>
            </form>
          </div>

          <div class="buttons">
            <button type="button" class="btn btn-secondary" onclick="cancel()">Cancel</button>
            <button type="submit" class="btn btn-primary" onclick="createScript()">Create Script</button>
          </div>
        </div>

        <script>
          const vscode = acquireVsCodeApi();

          // Handle form submission
          document.getElementById('scriptForm').addEventListener('submit', function(e) {
            e.preventDefault();
            createScript();
          });

          function createScript() {
            const name = document.getElementById('name').value.trim();
            const script = document.getElementById('script').value.trim();

            // Validate required fields
            let hasError = false;

            if (!name) {
              document.getElementById('nameError').style.display = 'block';
              document.getElementById('name').focus();
              hasError = true;
            } else {
              document.getElementById('nameError').style.display = 'none';
            }

            if (!script) {
              document.getElementById('scriptError').style.display = 'block';
              if (!hasError) {
                document.getElementById('script').focus();
              }
              hasError = true;
            } else {
              document.getElementById('scriptError').style.display = 'none';
            }

            if (hasError) {
              return;
            }

            const scriptData = {
              name: name,
              script: script
            };

            vscode.postMessage({
              command: 'createScript',
              scriptData: scriptData
            });
          }

          function cancel() {
            vscode.postMessage({
              command: 'cancel'
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
