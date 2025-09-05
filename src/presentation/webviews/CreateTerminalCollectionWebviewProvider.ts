import * as vscode from 'vscode';
import { TerminalCollection, Script, LifecycleEvent, UpdateTerminalCollection } from '@codestate/core';
import { ErrorHandler } from '../../shared/errors/ErrorHandler';
import { ExtensionError, ErrorContext } from '../../shared/errors/ExtensionError';
import { GetScripts } from '@codestate/core';

export class CreateTerminalCollectionWebviewProvider {
  private static readonly viewType = 'codestate.createTerminalCollection';
  private panel: vscode.WebviewPanel | undefined;
  private errorHandler: ErrorHandler;
  private scriptsByProject: Map<string, Script[]> = new Map();
  private isUpdateMode: boolean = false;
  private existingCollectionData: any = null;

  constructor() {
    this.errorHandler = ErrorHandler.getInstance();
  }

  async show(): Promise<void> {
    await this.showInternal(false);
  }

  async showUpdate(collectionData: any): Promise<void> {
    this.isUpdateMode = true;
    this.existingCollectionData = collectionData;
    await this.showInternal(true);
  }

  private async showInternal(isUpdate: boolean): Promise<void> {
    // Get current workspace path
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const currentWorkspace = workspaceFolders && workspaceFolders.length > 0 ? workspaceFolders[0].uri.fsPath : '';

    // Load all scripts grouped by project
    await this.loadScriptsByProject();

    // Create and show panel
    this.panel = vscode.window.createWebviewPanel(
      CreateTerminalCollectionWebviewProvider.viewType,
      isUpdate ? 'Update Terminal Collection' : 'Create Terminal Collection',
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
    this.panel.webview.html = this.getWebviewContent(currentWorkspace, isUpdate);

    // If in update mode, send the existing data to pre-populate the form
    if (isUpdate && this.existingCollectionData) {
      this.panel.webview.postMessage({
        command: 'prepopulateForm',
        collectionData: this.existingCollectionData
      });
    }

    // Handle messages from the webview
    this.panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'createTerminalCollection':
            await this.handleCreateTerminalCollection(message.collectionData);
            break;
          case 'updateTerminalCollection':
            await this.handleUpdateTerminalCollection(message.collectionData);
            break;
          case 'getScripts':
            this.panel?.webview.postMessage({
              command: 'scriptsData',
              scriptsByProject: Object.fromEntries(this.scriptsByProject)
            });
            break;
          case 'prepopulateForm':
            // This is handled by the webview JavaScript
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

  private async loadScriptsByProject(): Promise<void> {
    try {
      // Get all scripts from the entire project
      const getScripts = new GetScripts();
      const result = await getScripts.execute();
      
      if (result.ok && result.value.length > 0) {
        // Group scripts by their root path
        const scriptsByPath = new Map<string, Script[]>();
        
        result.value.forEach((script: Script) => {
          const rootPath = script.rootPath;
          if (!scriptsByPath.has(rootPath)) {
            scriptsByPath.set(rootPath, []);
          }
          scriptsByPath.get(rootPath)!.push(script);
        });
        
        this.scriptsByProject = scriptsByPath;
      }
    } catch (error) {
      console.warn('Failed to load all scripts:', error);
    }
  }

  private async handleCreateTerminalCollection(collectionData: any): Promise<void> {
    try {
      console.log("CreateTerminalCollectionWebviewProvider: handleCreateTerminalCollection called");

      // Prepare the data to pass to the command
      const collectionDataToPass = {
        name: collectionData.name,
        rootPath: collectionData.rootPath,
        lifecycle: collectionData.lifecycle,
        scriptReferences: collectionData.scriptReferences,
        closeTerminalAfterExecution: collectionData.closeTerminalAfterExecution
      };

      console.log("CreateTerminalCollectionWebviewProvider: Collection data prepared:", collectionDataToPass);

      // Execute the command with collection data
      await vscode.commands.executeCommand("codestate.saveTerminalCollection", collectionDataToPass);

      // The SaveTerminalCollectionCommand will handle cache clearing and refresh
      // No need to duplicate the operations here

      // Close the panel after the command has been executed
      this.panel?.dispose();

    } catch (error) {
      const extensionError = error instanceof ExtensionError ? error : ExtensionError.fromError(
        error instanceof Error ? error : new Error(String(error)),
        undefined,
        ErrorContext.SESSION_MANAGEMENT
      );
      
      this.errorHandler.handleError(
        extensionError,
        ErrorContext.SESSION_MANAGEMENT,
        true
      );

      vscode.window
        .showErrorMessage(
          `Failed to create terminal collection. Check the output panel for details.`,
          "Show Details",
          "Dismiss"
        )
        .then((selection) => {
          if (selection === "Show Details") {
            this.errorHandler.showOutputChannel();
          }
        });
    }
  }

  private async handleUpdateTerminalCollection(collectionData: any): Promise<void> {
    try {
      console.log("CreateTerminalCollectionWebviewProvider: handleUpdateTerminalCollection called");

      // Prepare the data to pass to the command
      const collectionDataToPass = {
        id: this.existingCollectionData.id, // Assuming 'id' is available in existingCollectionData
        name: collectionData.name,
        rootPath: collectionData.rootPath,
        lifecycle: collectionData.lifecycle,
        scriptReferences: collectionData.scriptReferences,
        closeTerminalAfterExecution: collectionData.closeTerminalAfterExecution
      };

      console.log("CreateTerminalCollectionWebviewProvider: Collection data prepared:", collectionDataToPass);

      // Execute the command with collection data
      await vscode.commands.executeCommand("codestate.updateTerminalCollection", collectionDataToPass);

      // The UpdateTerminalCollectionCommand will handle cache clearing and refresh
      // No need to duplicate the operations here

      // Close the panel after the command has been executed
      this.panel?.dispose();

    } catch (error) {
      const extensionError = error instanceof ExtensionError ? error : ExtensionError.fromError(
        error instanceof Error ? error : new Error(String(error)),
        undefined,
        ErrorContext.SESSION_MANAGEMENT
      );
      
      this.errorHandler.handleError(
        extensionError,
        ErrorContext.SESSION_MANAGEMENT,
        true
      );

      vscode.window
        .showErrorMessage(
          `Failed to update terminal collection. Check the output panel for details.`,
          "Show Details",
          "Dismiss"
        )
        .then((selection) => {
          if (selection === "Show Details") {
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
        <title>Create Terminal Collection</title>
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

          .form-group input[type="text"] {
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

          .form-group input:focus {
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

          .accordion {
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            margin-bottom: 10px;
          }

          .accordion-header {
            background-color: var(--vscode-panel-background);
            padding: 12px 15px;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--vscode-panel-border);
          }

          .accordion-header:hover {
            background-color: var(--vscode-list-hoverBackground);
          }

          .accordion-content {
            padding: 15px;
            background-color: var(--vscode-editor-background);
            display: none;
          }

          .accordion-content.expanded {
            display: block;
          }

          .script-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            margin-bottom: 8px;
            background-color: var(--vscode-input-background);
          }

          .script-item:hover {
            background-color: var(--vscode-list-hoverBackground);
          }

          .script-item input[type="checkbox"] {
            width: 16px;
            height: 16px;
            accent-color: var(--vscode-button-background);
          }

          .script-info {
            flex: 1;
          }

          .script-name {
            font-weight: 500;
            color: var(--vscode-editor-foreground);
          }

          .script-command {
            font-size: 0.9em;
            color: var(--vscode-descriptionForeground);
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          }



          .add-script-btn {
            margin-top: 10px;
            width: 100%;
          }

          .selected-scripts {
            margin-top: 15px;
            padding: 15px;
            background-color: var(--vscode-textBlockQuote-background);
            border-left: 3px solid var(--vscode-textBlockQuote-border);
            border-radius: 4px;
          }

          .selected-scripts h3 {
            margin: 0 0 10px 0;
            color: var(--vscode-editor-foreground);
            font-size: 1.1em;
          }

          .selected-script-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px;
            background-color: var(--vscode-editor-background);
            border-radius: 4px;
            margin-bottom: 5px;
          }

          .remove-script-btn {
            background: none;
            border: none;
            color: var(--vscode-errorForeground);
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            font-size: 16px;
          }

          .remove-script-btn:hover {
            background-color: var(--vscode-inputValidation-errorBackground);
          }

          .main-content {
            display: flex;
            gap: 20px;
            align-items: flex-start;
          }

          .left-column {
            flex: 0 0 40%;
          }

          .right-column {
            flex: 0 0 60%;
          }

          @media (max-width: 670px) {
            .main-content {
              flex-direction: column;
            }
            
            .left-column,
            .right-column {
              flex: 1;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 ${isUpdate ? 'Update' : 'Create'} Terminal Collection</h1>
          </div>

          <div class="form-container">
            <form id="collectionForm">
              <div class="main-content">
                <!-- Left Column: Collection Details and Lifecycle Events -->
                <div class="left-column">
                  <!-- Collection Details Section -->
                  <div class="section">
                    <h2>🎯 Collection Details</h2>
                    
                    <div class="form-group">
                      <label for="name">Collection Name *</label>
                      <input type="text" id="name" name="name" required placeholder="e.g., Build & Test, Development Setup, Production Deploy">
                      <div class="description">A descriptive name for your terminal collection</div>
                      <div class="error" id="nameError">Collection name is required</div>
                    </div>

                    <div class="form-group">
                      <label for="rootPath">Root Path</label>
                      <input type="text" id="rootPath" name="rootPath" placeholder="Path to the project root">
                      <div class="description">The root directory where this collection will be executed (defaults to current workspace)</div>
                      <div class="error" id="rootPathError">Invalid path</div>
                    </div>
                  </div>

                  <!-- Lifecycle Events Section -->
                  <div class="section">
                    <h2>⚙️ Lifecycle Events</h2>
                    
                    <div class="form-group">
                      <label for="lifecycle">When to Execute</label>
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
                      <div class="description">When this terminal collection should be executed</div>
                    </div>

                    <div class="form-group">
                      <label class="checkbox-item">
                        <input type="checkbox" id="closeTerminalAfterExecution" name="closeTerminalAfterExecution">
                        <span>Close Terminal After Execution</span>
                      </label>
                      <div class="description">Automatically close the terminal when the collection finishes</div>
                    </div>
                  </div>
                </div>

                <!-- Right Column: Scripts Selection -->
                <div class="right-column">
                  <div class="section">
                    <h2>📜 Scripts</h2>
                    
                    <div class="description">
                      Select scripts to include in this terminal collection. Scripts will be executed in priority order.
                    </div>

                    <div id="scriptsAccordion">
                      <!-- Scripts will be loaded here dynamically -->
                    </div>

                    <div class="selected-scripts" id="selectedScripts" style="display: none;">
                      <h3>Selected Scripts</h3>
                      <div id="selectedScriptsList">
                        <!-- Selected scripts will be shown here -->
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>

          <div class="buttons">
            <button type="button" class="btn btn-secondary" onclick="cancel()">Cancel</button>
            <button type="submit" class="btn btn-primary" onclick="${isUpdate ? 'updateTerminalCollection' : 'createTerminalCollection'}()">${isUpdate ? 'Update' : 'Create'} Collection</button>
          </div>
        </div>

        <script>
          const vscode = acquireVsCodeApi();
          
          // Handle messages from the extension
          window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
              case 'prepopulateForm':
                prepopulateForm(message.collectionData);
                break;
              case 'scriptsData':
                // Scripts data is handled by the existing getScripts function
                break;
            }
          });
          let scriptsByProject = {};
          let selectedScripts = [];

          // Initialize
          document.addEventListener('DOMContentLoaded', function() {
            document.getElementById('name').focus();
            
            // Set default root path to current workspace
            const currentWorkspace = '${workspacePath.replace(/\\/g, '\\\\')}';
            if (currentWorkspace) {
              document.getElementById('rootPath').value = currentWorkspace;
            }

            // Request scripts data
            vscode.postMessage({
              command: 'getScripts'
            });
          });

          // Handle messages from extension
          window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
              case 'scriptsData':
                scriptsByProject = message.scriptsByProject;
                renderScriptsAccordion();
                break;
            }
          });

          // Handle form submission
          document.getElementById('collectionForm').addEventListener('submit', function(e) {
            e.preventDefault();
            createTerminalCollection();
          });

          function renderScriptsAccordion() {
            const accordion = document.getElementById('scriptsAccordion');
            accordion.innerHTML = '';

            Object.entries(scriptsByProject).forEach(([rootPath, scripts]) => {
              const accordionItem = document.createElement('div');
              accordionItem.className = 'accordion';
              
              const header = document.createElement('div');
              header.className = 'accordion-header';
              header.innerHTML = \`
                <span>📁 \${rootPath.split('/').pop() || rootPath}</span>
                <span>📜 \${scripts.length} scripts</span>
              \`;
              
              const content = document.createElement('div');
              content.className = 'accordion-content';
              
                             scripts.forEach(script => {
                 const scriptItem = document.createElement('div');
                 scriptItem.className = 'script-item';
                 scriptItem.innerHTML = \`
                   <input type="checkbox" id="script-\${script.id}" onchange="toggleScript('\${script.id}', '\${script.name}', '\${script.commands?.[0]?.command || script.script || ''}', '\${rootPath}', this.checked)">
                   <div class="script-info">
                     <div class="script-name">\${script.name}</div>
                     <div class="script-command">\${script.commands?.[0]?.command || script.script || ''}</div>
                   </div>
                 \`;
                 content.appendChild(scriptItem);
               });

              const addScriptBtn = document.createElement('button');
              addScriptBtn.type = 'button';
              addScriptBtn.className = 'btn btn-secondary add-script-btn';
              addScriptBtn.textContent = '➕ Add New Script';
              addScriptBtn.onclick = () => addNewScript(rootPath);
              content.appendChild(addScriptBtn);

              accordionItem.appendChild(header);
              accordionItem.appendChild(content);
              accordion.appendChild(accordionItem);

              // Keep accordion expanded by default
              content.classList.add('expanded');
              
              // Add click handler for accordion (optional - can be removed if you want them always open)
              header.addEventListener('click', () => {
                content.classList.toggle('expanded');
              });
            });
          }

          function toggleScript(scriptId, scriptName, scriptCommand, scriptRootPath, isChecked) {
            if (isChecked) {
              selectedScripts.push({
                id: scriptId,
                name: scriptName,
                command: scriptCommand,
                rootPath: scriptRootPath
              });
            } else {
              // Remove script
              selectedScripts = selectedScripts.filter(s => s.id !== scriptId);
            }
            
            updateSelectedScriptsDisplay();
          }



          function updateSelectedScriptsDisplay() {
            const container = document.getElementById('selectedScripts');
            const list = document.getElementById('selectedScriptsList');
            
            if (selectedScripts.length === 0) {
              container.style.display = 'none';
              return;
            }

            container.style.display = 'block';
            
            list.innerHTML = '';
            selectedScripts.forEach(script => {
              const item = document.createElement('div');
              item.className = 'selected-script-item';
              item.innerHTML = \`
                <span>\${script.name}</span>
                <button type="button" class="remove-script-btn" onclick="removeScript('\${script.id}')" title="Remove script">🗑️</button>
              \`;
              list.appendChild(item);
            });
          }

          function removeScript(scriptId) {
            // Remove script
            selectedScripts = selectedScripts.filter(s => s.id !== scriptId);
            
            document.getElementById(\`script-\${scriptId}\`).checked = false;
            updateSelectedScriptsDisplay();
          }

          function addNewScript(rootPath) {
            // TODO: Implement add new script functionality
            vscode.postMessage({
              command: 'addNewScript',
              rootPath: rootPath
            });
          }

          // TODO: Update this function to use getCollectionData() for consistency
          function createTerminalCollection() {
            const name = document.getElementById('name').value.trim();
            const rootPath = document.getElementById('rootPath').value.trim();

            // Validate required fields
            let hasError = false;

            if (!name) {
              document.getElementById('nameError').style.display = 'block';
              document.getElementById('name').focus();
              hasError = true;
            } else {
              document.getElementById('nameError').style.display = 'none';
            }

            if (selectedScripts.length === 0) {
              vscode.window.showErrorMessage('Please select at least one script for the collection.');
              return;
            }

            if (hasError) {
              return;
            }

            // Get lifecycle events
            const lifecycleCheckboxes = document.querySelectorAll('input[name="lifecycle"]:checked');
            const lifecycle = Array.from(lifecycleCheckboxes).map(cb => cb.value);

            // Get close terminal option
            const closeTerminalAfterExecution = document.getElementById('closeTerminalAfterExecution').checked;

            const collectionData = {
              name: name,
              rootPath: rootPath,
              lifecycle: lifecycle,
              scriptReferences: selectedScripts.map(s => ({
                id: s.id,
                rootPath: s.rootPath
              })),
              closeTerminalAfterExecution: closeTerminalAfterExecution
            };

            vscode.postMessage({
              command: 'createTerminalCollection',
              collectionData: collectionData
            });
          }

          function updateTerminalCollection() {
            const collectionData = getCollectionData();
            if (collectionData) {
              vscode.postMessage({
                command: 'updateTerminalCollection',
                collectionData: collectionData
              });
            }
          }

          function getCollectionData() {
            const name = document.getElementById('name').value.trim();
            const rootPath = document.getElementById('rootPath').value.trim();

            // Validate required fields
            let hasError = false;

            if (!name) {
              document.getElementById('nameError').style.display = 'block';
              document.getElementById('nameError').focus();
              hasError = true;
            } else {
              document.getElementById('nameError').style.display = 'none';
            }

            if (selectedScripts.length === 0) {
              vscode.window.showErrorMessage('Please select at least one script for the collection.');
              return null;
            }

            if (hasError) {
              return null;
            }

            // Get lifecycle events
            const lifecycleCheckboxes = document.querySelectorAll('input[name="lifecycle"]:checked');
            const lifecycle = Array.from(lifecycleCheckboxes).map(cb => cb.value);

            // Get close terminal option
            const closeTerminalAfterExecution = document.getElementById('closeTerminalAfterExecution').checked;

            return {
              name: name,
              rootPath: rootPath,
              lifecycle: lifecycle,
              scriptReferences: selectedScripts.map(s => ({
                id: s.id,
                rootPath: s.rootPath
              })),
              closeTerminalAfterExecution: closeTerminalAfterExecution
            };
          }

          function cancel() {
            vscode.postMessage({
              command: 'cancel'
            });
          }

          function prepopulateForm(collectionData) {
            // Pre-populate form fields with existing data
            if (collectionData.name) {
              document.getElementById('name').value = collectionData.name;
            }
            if (collectionData.rootPath) {
              document.getElementById('rootPath').value = collectionData.rootPath;
            }
            if (collectionData.closeTerminalAfterExecution !== undefined) {
              document.getElementById('closeTerminalAfterExecution').checked = collectionData.closeTerminalAfterExecution;
            }
            
            // Pre-populate lifecycle events
            if (collectionData.lifecycle && Array.isArray(collectionData.lifecycle)) {
              const lifecycleCheckboxes = document.querySelectorAll('input[name="lifecycle"]');
              lifecycleCheckboxes.forEach(checkbox => {
                checkbox.checked = collectionData.lifecycle.includes(checkbox.value);
              });
            }
            
            // Pre-populate selected scripts
            if (collectionData.scriptReferences && Array.isArray(collectionData.scriptReferences)) {
              // Wait for scripts to be loaded, then select them
              setTimeout(() => {
                collectionData.scriptReferences.forEach(scriptRef => {
                  const scriptCheckbox = document.getElementById(\`script-\${scriptRef.id}\`);
                  if (scriptCheckbox) {
                    scriptCheckbox.checked = true;
                    // Add to selectedScripts array
                    const script = findScriptById(scriptRef.id);
                    if (script) {
                      selectedScripts.push({
                        id: script.id,
                        name: script.name,
                        command: script.commands?.[0]?.command || script.script || '',
                        rootPath: script.rootPath
                      });
                    }
                  }
                });
                updateSelectedScriptsDisplay();
              }, 1000); // Wait for scripts to load
            }
          }

          function findScriptById(scriptId) {
            // Search through all scripts to find the one with matching ID
            for (const [rootPath, scripts] of Object.entries(scriptsByProject)) {
              const script = scripts.find(s => s.id === scriptId);
              if (script) {
                return script;
              }
            }
            return null;
          }
        </script>
      </body>
      </html>
    `;
  }
} 