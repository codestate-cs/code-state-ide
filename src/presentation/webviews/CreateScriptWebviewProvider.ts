import * as vscode from 'vscode';
import { CreateScript, UpdateScript } from '@codestate/core';
import { ErrorHandler } from '../../shared/errors/ErrorHandler';
import { ExtensionError, ErrorContext } from '../../shared/errors/ExtensionError';
import { DataCacheService } from '../../infrastructure/services/DataCacheService';
import { randomUUID } from 'crypto';

export class CreateScriptWebviewProvider {
  private static readonly viewType = 'codestate.createScript';
  private panel: vscode.WebviewPanel | undefined;
  private errorHandler: ErrorHandler;
  private isUpdateMode: boolean = false;
  private existingScriptData: any = null;

  constructor() {
    this.errorHandler = ErrorHandler.getInstance();
  }

  async show(): Promise<void> {
    await this.showInternal(false);
  }

  async showUpdate(scriptData: any): Promise<void> {
    this.isUpdateMode = true;
    this.existingScriptData = scriptData;
    await this.showInternal(true);
  }

  private async showInternal(isUpdate: boolean): Promise<void> {
    // Get current workspace path
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const currentWorkspace = workspaceFolders && workspaceFolders.length > 0 ? workspaceFolders[0].uri.fsPath : '';

    // Create and show panel
    this.panel = vscode.window.createWebviewPanel(
      CreateScriptWebviewProvider.viewType,
      isUpdate ? 'Update Script' : 'Create New Script',
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

    // Set the webview's initial html content with workspace path and update mode
    this.panel.webview.html = this.getWebviewContent(currentWorkspace, isUpdate);

            // Handle messages from the webview
        this.panel.webview.onDidReceiveMessage(
          async (message) => {
            switch (message.command) {
              case 'createScript':
                await this.handleCreateScript(message.scriptData);
                break;
              case 'updateScript':
                await this.handleUpdateScript(message.scriptData);
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
    await this.handleScriptOperation(scriptData, false);
  }

  private async handleUpdateScript(scriptData: any): Promise<void> {
    await this.handleScriptOperation(scriptData, true);
  }

  private async handleScriptOperation(scriptData: any, isUpdate: boolean): Promise<void> {
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
            title: isUpdate ? 'Updating script...' : 'Creating new script...',
            cancellable: false
          },
        async (progress) => {
          progress.report({ increment: 0, message: 'Validating script...' });
          console.log('scriptData.commands', scriptData);
          // Transform scriptData to match the new Script interface
          const scriptPayload = {
            id: randomUUID(), // Temporary ID that will be replaced by the service
            name: scriptData.name,
            rootPath: scriptData.rootPath || projectRoot, // Use provided rootPath or fallback to current workspace
            commands: scriptData.commands || [],
            lifecycle: scriptData.lifecycle || ['none'],
            executionMode: scriptData.executionMode || 'new-terminals',
            closeTerminalAfterExecution: scriptData.closeTerminalAfterExecution || false
          };

          let result;
          
          if (isUpdate) {
            // Update existing script using UpdateScript
            const updateScript = new UpdateScript();
            result = await updateScript.execute(scriptPayload.name, scriptPayload.rootPath, {
              commands: scriptPayload.commands,
              lifecycle: scriptPayload.lifecycle,
              executionMode: scriptPayload.executionMode,
              closeTerminalAfterExecution: scriptPayload.closeTerminalAfterExecution
            });
          } else {
            // Create new script using CreateScript
            const createScript = new CreateScript();
            result = await createScript.execute(scriptPayload);
          }
          
          if (!result.ok) {
            throw new Error(`Failed to ${isUpdate ? 'update' : 'create'} script: ${result.error.message}`);
          }

          progress.report({ increment: 100, message: isUpdate ? 'Script updated successfully' : 'Script created successfully' });
          
          // Highlight the newly created script in the tree view
          try {
            const globalSessionsTreeViewProvider = (global as any).sessionsTreeViewProvider;
            if (globalSessionsTreeViewProvider) {
              // Get the script ID from the payload (since CreateScript returns Result<void>)
              const scriptId = scriptPayload.id;
              if (scriptId) {
                await globalSessionsTreeViewProvider.highlightNewItem(scriptId, 'script');
              }
            }
          } catch (error) {
            console.error('Error highlighting new script:', error);
          }
        }
      );

      // Show success message
      const action = isUpdate ? 'updated' : 'created';
      vscode.window.showInformationMessage(`Script "${scriptData.name}" ${action} successfully!`);

      // Close the panel
      this.panel?.dispose();

      // Refresh the sessions tree view (this will also clear and refresh cache)
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

  private getWebviewContent(workspacePath: string = '', isUpdate: boolean = false): string {
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
          .form-group textarea,
          .form-group select {
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
          .form-group textarea:focus,
          .form-group select:focus {
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

          .checkbox-group {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 5px;
          }

          .checkbox-item {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 0.9em;
          }

          .checkbox-item input[type="checkbox"] {
            width: 16px;
            height: 16px;
            accent-color: var(--vscode-button-background);
          }

          .command-row {
            display: flex;
            gap: 15px;
            align-items: flex-start;
          }

          .command-row .form-group {
            flex: 1;
            margin-bottom: 15px;
          }

          .command-row .form-group:last-child {
            margin-bottom: 0;
          }

          .command-row {
            position: relative;
          }

          .delete-command-btn {
            position: absolute;
            top: 0;
            right: 0;
            background: none;
            border: none;
            color: var(--vscode-errorForeground);
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            font-size: 16px;
            line-height: 1;
            transition: background-color 0.2s;
          }

          .delete-command-btn:hover {
            background-color: var(--vscode-inputValidation-errorBackground);
          }

          .delete-command-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .main-content {
            display: flex;
            gap: 20px;
            align-items: flex-start;
          }

          .script-details-column {
            flex: 0 0 60%;
          }

          .execution-options-column {
            flex: 0 0 40%;
            margin-right: 20px;
          }

          @media (max-width: 670px) {
            .main-content {
              flex-direction: column;
            }
            
            .script-details-column,
            .execution-options-column {
              flex: 1;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🖥️ ${isUpdate ? 'Update Script' : 'Create New Script'}</h1>
          </div>

          <div class="form-container">
            <form id="scriptForm">
              <div class="main-content">
                <!-- Script Details Column -->
                <div class="script-details-column">
                  <div class="section">
                    <h2>🎯 Script Details</h2>
                    
                    <div class="form-group">
                      <label for="name">Script Name *</label>
                      <input type="text" id="name" name="name" required placeholder="e.g., Build, Test, Deploy, Setup">
                      <div class="description">A descriptive name for your script</div>
                      <div class="error" id="nameError">Script name is required</div>
                    </div>

                    <div class="form-group">
                      <label for="commands">Script Commands *</label>
                      <div class="description">Add the commands that will be executed when this script is run</div>
                      
                      <div id="commandsContainer">
                        <!-- Commands will be added here dynamically -->
                      </div>
                      
                      <button type="button" class="btn btn-secondary" onclick="addCommand()" style="margin-top: 10px;">
                        ➕ Add Another Command
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Execution Options Column -->
                <div class="execution-options-column">
                  <div class="section">
                    <h2>⚙️ Execution Options</h2>
                    
                    <div class="form-group">
                      <label for="rootPath">Root Path</label>
                      <input type="text" id="rootPath" name="rootPath" placeholder="Path to the project root">
                      <div class="description">The root directory where this script will be executed (defaults to current workspace)</div>
                      <div class="error" id="rootPathError">Invalid path</div>
                    </div>

                    <div class="form-group">
                      <label for="lifecycle">Lifecycle Events</label>
                      <div class="checkbox-group">
                        <label class="checkbox-item">
                          <input type="checkbox" name="lifecycle" value="open" checked>
                          <span>Open</span>
                        </label>
                        <label class="checkbox-item">
                          <input type="checkbox" name="lifecycle" value="resume" checked>
                          <span>Resume</span>
                        </label>
                        <label class="checkbox-item">
                          <input type="checkbox" name="lifecycle" value="none">
                          <span>None</span>
                        </label>
                      </div>
                      <div class="description">When this script should be executed</div>
                    </div>



                    <div class="form-group">
                      <label class="checkbox-item">
                        <input type="checkbox" id="closeTerminalAfterExecution" name="closeTerminalAfterExecution">
                        <span>Close Terminal After Execution</span>
                      </label>
                      <div class="description">Automatically close the terminal when the script finishes</div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>

          <div class="buttons">
            <button type="button" class="btn btn-secondary" onclick="cancel()">Cancel</button>
            <button type="submit" class="btn btn-primary" onclick="createScript()">${isUpdate ? 'Update Script' : 'Create Script'}</button>
          </div>
        </div>

        <script>
          const vscode = acquireVsCodeApi();

          // Initialize with first command
          document.addEventListener('DOMContentLoaded', function() {
            document.getElementById('name').focus();
            
            // Set default root path to current workspace
            const currentWorkspace = '${workspacePath.replace(/\\/g, '\\\\')}';
            if (currentWorkspace) {
              document.getElementById('rootPath').value = currentWorkspace;
            }

            // Check if we're in update mode
            const isUpdateMode = ${isUpdate};
            if (isUpdateMode) {
              preloadScriptData();
            } else {
              addCommand(); // Add the first command field for new scripts
            }
          });

          // Handle form submission
          document.getElementById('scriptForm').addEventListener('submit', function(e) {
            e.preventDefault();
            createScript();
          });

          // Function to preload existing script data for updates
          function preloadScriptData() {
            const scriptData = ${JSON.stringify(this.existingScriptData || {}).replace(/\\/g, '\\\\')};
            
            if (scriptData.name) {
              document.getElementById('name').value = scriptData.name;
            }
            
            if (scriptData.rootPath) {
              document.getElementById('rootPath').value = scriptData.rootPath;
            }
            
            if (scriptData.commands && scriptData.commands.length > 0) {
              // Add the first command row
              addCommand();
              
              scriptData.commands.forEach((command, index) => {
                if (index > 0) {
                  addCommand(); // Add additional command rows
                }
                
                const nameInput = document.querySelector(\`input[name="commands[\${index}][name]"]\`);
                const scriptInput = document.querySelector(\`input[name="commands[\${index}][command]"]\`);
                
                if (nameInput) nameInput.value = command.name || '';
                if (scriptInput) scriptInput.value = command.command || '';
              });
            }
            
            if (scriptData.lifecycle && scriptData.lifecycle.length > 0) {
              // Reset all checkboxes first
              document.querySelectorAll('input[name="lifecycle"]').forEach(cb => cb.checked = false);
              
              // Check the appropriate ones
              scriptData.lifecycle.forEach(event => {
                const checkbox = document.querySelector(\`input[name="lifecycle"][value="\${event}"]\`);
                if (checkbox) checkbox.checked = true;
              });
            }
            
            if (scriptData.closeTerminalAfterExecution !== undefined) {
              document.getElementById('closeTerminalAfterExecution').checked = scriptData.closeTerminalAfterExecution;
            }
          }

          function createScript() {
            const name = document.getElementById('name').value.trim();
            const rootPath = document.getElementById('rootPath').value.trim();
            const isUpdateMode = ${isUpdate};

            // Validate required fields
            let hasError = false;

            if (!name) {
              document.getElementById('nameError').style.display = 'block';
              document.getElementById('name').focus();
              hasError = true;
            } else {
              document.getElementById('nameError').style.display = 'none';
            }

            // Validate commands
            const commandsContainer = document.getElementById('commandsContainer');
            const commandRows = commandsContainer.querySelectorAll('.command-row');
            const commands = [];
            
            commandRows.forEach((row, index) => {
              const commandNameInput = row.querySelector(\`input[name="commands[\${index}][name]"]\`);
              const commandScriptInput = row.querySelector(\`input[name="commands[\${index}][command]"]\`);
              
              const commandName = commandNameInput.value.trim();
              const commandScript = commandScriptInput.value.trim();
              
              let rowHasError = false;
              
              if (!commandName) {
                document.getElementById(\`commandNameError-\${index}\`).style.display = 'block';
                rowHasError = true;
              } else {
                document.getElementById(\`commandNameError-\${index}\`).style.display = 'none';
              }
              
              if (!commandScript) {
                document.getElementById(\`commandScriptError-\${index}\`).style.display = 'block';
                rowHasError = true;
              } else {
                document.getElementById(\`commandScriptError-\${index}\`).style.display = 'none';
              }
              
              if (rowHasError) {
                hasError = true;
              } else {
                commands.push({
                  command: commandScript,
                  name: commandName,
                  priority: index + 1
                });
              }
            });

            if (hasError) {
              return;
            }

            // Get lifecycle events
            const lifecycleCheckboxes = document.querySelectorAll('input[name="lifecycle"]:checked');
            const lifecycle = Array.from(lifecycleCheckboxes).map(cb => cb.value);

            // Execution mode is always set to new-terminals
            const executionMode = 'new-terminals';

            // Get close terminal option
            const closeTerminalAfterExecution = document.getElementById('closeTerminalAfterExecution').checked;

            const scriptData = {
              name: name,
              rootPath: rootPath,
              script: '', // Empty string as requested
              commands: commands,
              lifecycle: lifecycle,
              executionMode: executionMode,
              closeTerminalAfterExecution: closeTerminalAfterExecution
            };

            vscode.postMessage({
              command: isUpdateMode ? 'updateScript' : 'createScript',
              scriptData: scriptData
            });
          }

          function cancel() {
            vscode.postMessage({
              command: 'cancel'
            });
          }

          // Function to add a new command field
          function addCommand() {
            const commandsContainer = document.getElementById('commandsContainer');
            const commandCount = commandsContainer.children.length;

            const commandDiv = document.createElement('div');
            commandDiv.className = 'command-row';
            commandDiv.innerHTML = \`
              <div class="form-group">
                <label for="commandName-\${commandCount}">Command \${commandCount + 1} Name *</label>
                <input type="text" id="commandName-\${commandCount}" name="commands[\${commandCount}][name]" required placeholder="e.g., Build, Test, Deploy">
                <div class="description">A descriptive name for this command</div>
                <div class="error" id="commandNameError-\${commandCount}">Command name is required</div>
              </div>
              <div class="form-group">
                <label for="commandScript-\${commandCount}">Command \${commandCount + 1} Script *</label>
                <input type="text" id="commandScript-\${commandCount}" name="commands[\${commandCount}][command]" required placeholder="e.g., npm run build, yarn start, python manage.py runserver">
                <div class="description">The actual command to execute</div>
                <div class="error" id="commandScriptError-\${commandCount}">Command script is required</div>
              </div>
              <button type="button" class="delete-command-btn" onclick="deleteCommand(\${commandCount})" title="Delete this command" \${commandCount === 0 ? 'disabled' : ''}>
                🗑️
              </button>
            \`;
            commandsContainer.appendChild(commandDiv);

            // Add event listeners for the new command inputs
            document.getElementById(\`commandName-\${commandCount}\`).addEventListener('input', function() {
              document.getElementById(\`commandNameError-\${commandCount}\`).style.display = 'none';
            });
            document.getElementById(\`commandScript-\${commandCount}\`).addEventListener('input', function() {
              document.getElementById(\`commandScriptError-\${commandCount}\`).style.display = 'none';
            });

            // Update delete button states
            updateDeleteButtonStates();
          }

          // Function to delete a command
          function deleteCommand(index) {
            const commandsContainer = document.getElementById('commandsContainer');
            const commandRow = commandsContainer.children[index];
            
            if (commandRow) {
              commandRow.remove();
              updateDeleteButtonStates();
              reorderCommandLabels();
            }
          }

          // Function to update delete button states
          function updateDeleteButtonStates() {
            const commandsContainer = document.getElementById('commandsContainer');
            const commandRows = commandsContainer.querySelectorAll('.command-row');
            const deleteButtons = commandsContainer.querySelectorAll('.delete-command-btn');
            
            deleteButtons.forEach((button, index) => {
              // Disable delete button if only one command remains
              if (commandRows.length <= 1) {
                button.disabled = true;
              } else {
                button.disabled = false;
              }
            });
          }

          // Function to reorder command labels after deletion
          function reorderCommandLabels() {
            const commandsContainer = document.getElementById('commandsContainer');
            const commandRows = commandsContainer.querySelectorAll('.command-row');
            
            commandRows.forEach((row, index) => {
              const nameLabel = row.querySelector('label[for^="commandName-"]');
              const scriptLabel = row.querySelector('label[for^="commandScript-"]');
              const nameInput = row.querySelector('input[name^="commands"][name$="[name]"]');
              const scriptInput = row.querySelector('input[name^="commands"][name$="[command]"]');
              
              if (nameLabel && scriptLabel && nameInput && scriptInput) {
                // Update labels
                nameLabel.textContent = \`Command \${index + 1} Name *\`;
                scriptLabel.textContent = \`Command \${index + 1} Script *\`;
                
                // Update input IDs and names
                const newIndex = index;
                nameInput.id = \`commandName-\${newIndex}\`;
                nameInput.name = \`commands[\${newIndex}][name]\`;
                scriptInput.id = \`commandScript-\${newIndex}\`;
                scriptInput.name = \`commands[\${newIndex}][command]\`;
                
                // Update error message IDs
                const nameError = row.querySelector(\`#commandNameError-\${index}\`);
                const scriptError = row.querySelector(\`#commandScriptError-\${index}\`);
                if (nameError) nameError.id = \`commandNameError-\${newIndex}\`;
                if (scriptError) scriptError.id = \`commandScriptError-\${newIndex}\`;
              }
            });
          }
        </script>
      </body>
      </html>
    `;
  }
} 