import * as vscode from 'vscode';
import { ConfigService } from '../../infrastructure/services/ConfigService';
import { ErrorHandler } from '../../shared/errors/ErrorHandler';
import { ExtensionError, ErrorContext } from '../../shared/errors/ExtensionError';
import type { Config } from '@codestate/core';

export class ConfigWebviewProvider {
  private static readonly viewType = 'codestate.configEditor';
  private panel: vscode.WebviewPanel | undefined;
  private configService: ConfigService;
  private errorHandler: ErrorHandler;

  constructor() {
    this.configService = ConfigService.getInstance();
    this.errorHandler = ErrorHandler.getInstance();
  }

  async show(config: Config): Promise<void> {
    // Create and show panel
    this.panel = vscode.window.createWebviewPanel(
      ConfigWebviewProvider.viewType,
      'CodeState Configuration Editor',
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
    this.panel.webview.html = this.getWebviewContent(config);

    // Handle messages from the webview
    this.panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'saveConfig':
            await this.handleSaveConfig(message.config);
            break;
          case 'cancel':
            this.panel?.dispose();
            break;
          case 'resetToDefault':
            await this.handleResetToDefault();
            break;
        }
      }
    );

    // Handle panel disposal
    this.panel.onDidDispose(() => {
      this.panel = undefined;
    });
  }

  private async handleSaveConfig(config: Config): Promise<void> {
    try {
      // Show progress indicator
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Saving CodeState configuration...',
          cancellable: false
        },
        async (progress) => {
          progress.report({ increment: 0, message: 'Validating configuration...' });

          // Use ConfigService to save the configuration
          const success = await this.configService.saveConfig(config);
          
          if (success) {
            progress.report({ increment: 100, message: 'Configuration saved successfully' });
          } else {
            throw new Error('Failed to save configuration');
          }
        }
      );

      // Show success message
      vscode.window.showInformationMessage('Configuration saved successfully');

      // Close the panel
      this.panel?.dispose();

      // Refresh the config tree view
      vscode.commands.executeCommand('codestate.refreshConfig');

    } catch (error) {
      const extensionError = error instanceof ExtensionError ? error : ExtensionError.fromError(
        error instanceof Error ? error : new Error(String(error)),
        undefined,
        ErrorContext.CONFIGURATION
      );
      
      this.errorHandler.handleError(extensionError, ErrorContext.CONFIGURATION, true);
      
      vscode.window.showErrorMessage(
        'Failed to save configuration. Check the output panel for details.',
        'Show Details',
        'Dismiss'
      ).then(selection => {
        if (selection === 'Show Details') {
          this.errorHandler.showOutputChannel();
        }
      });
    }
  }

  private async handleResetToDefault(): Promise<void> {
    try {
      // Show progress indicator
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Resetting CodeState configuration to defaults...',
          cancellable: false
        },
        async (progress) => {
          progress.report({ increment: 0, message: 'Creating default configuration...' });

          // Create default configuration
          const defaultConfig: Config = {
            version: '1.0.0',
            ide: 'vscode',
            storagePath: '',
            encryption: {
              enabled: false,
              encryptionKey: undefined
            },
            logger: {
              level: 'LOG',
              sinks: ['console'],
              filePath: undefined
            },
            experimental: {}
          };

          progress.report({ increment: 50, message: 'Saving default configuration...' });

          // Use ConfigService to save the default configuration
          const success = await this.configService.saveConfig(defaultConfig);
          
          if (success) {
            progress.report({ increment: 100, message: 'Configuration reset successfully' });
          } else {
            throw new Error('Failed to reset configuration');
          }
        }
      );

      // Show success message
      vscode.window.showInformationMessage('Configuration reset to defaults successfully');

      // Close the panel
      this.panel?.dispose();

      // Refresh the config tree view
      vscode.commands.executeCommand('codestate.refreshConfig');

    } catch (error) {
      const extensionError = error instanceof ExtensionError ? error : ExtensionError.fromError(
        error instanceof Error ? error : new Error(String(error)),
        undefined,
        ErrorContext.CONFIGURATION
      );
      
      this.errorHandler.handleError(extensionError, ErrorContext.CONFIGURATION, true);
      
      vscode.window.showErrorMessage(
        'Failed to reset configuration. Check the output panel for details.',
        'Show Details',
        'Dismiss'
      ).then(selection => {
        if (selection === 'Show Details') {
          this.errorHandler.showOutputChannel();
        }
      });
    }
  }

  private getWebviewContent(config: Config): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CodeState Configuration Editor</title>
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
          .form-group input[type="number"],
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
            cursor: pointer;
          }

          .form-group select {
            background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
            background-repeat: no-repeat;
            background-position: right 8px center;
            background-size: 16px;
            padding-right: 32px;
            appearance: none;
            -webkit-appearance: none;
            -moz-appearance: none;
          }

          .form-group input[type="checkbox"] {
            margin-right: 8px;
          }

          .form-group input:focus,
          .form-group select:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
          }

          .checkbox-group {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
          }

          .checkbox-group label {
            margin: 0;
            margin-left: 8px;
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

          .btn-danger {
            background-color: var(--vscode-errorForeground);
            color: var(--vscode-button-foreground);
          }

          .btn-danger:hover {
            background-color: var(--vscode-errorForeground);
            opacity: 0.8;
          }

          .description {
            font-size: 0.9em;
            color: var(--vscode-descriptionForeground);
            margin-top: 5px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚙️ CodeState Configuration Editor</h1>
          </div>

          <div class="form-container">
            <form id="configForm">
              <!-- Core Settings Section -->
              <div class="section">
                <h2>🎯 Core Settings</h2>
                
                <div class="form-group">
                  <label for="version">Version</label>
                  <input type="text" id="version" name="version" value="${config.version}" readonly>
                  <div class="description">CodeState core version (read-only)</div>
                </div>

                <div class="form-group">
                  <label for="ide">IDE</label>
                  <select id="ide" name="ide">
                    <option value="vscode" ${config.ide === 'vscode' ? 'selected' : ''}>VS Code</option>
                    <option value="cursor" ${config.ide === 'cursor' ? 'selected' : ''}>Cursor</option>
                  </select>
                  <div class="description">Select your preferred IDE</div>
                </div>

                <div class="form-group">
                  <label for="storagePath">Storage Path</label>
                  <input type="text" id="storagePath" name="storagePath" value="${config.storagePath}">
                  <div class="description">Path where CodeState data is stored</div>
                </div>
              </div>

              <!-- Encryption Settings Section -->
              <div class="section">
                <h2>🔐 Encryption Settings</h2>
                
                <div class="checkbox-group">
                  <input type="checkbox" id="encryptionEnabled" name="encryption.enabled" ${config.encryption.enabled ? 'checked' : ''}>
                  <label for="encryptionEnabled">Enable encryption for data</label>
                </div>

                <div class="form-group">
                  <label for="encryptionKey">Encryption Key</label>
                  <input type="text" id="encryptionKey" name="encryption.encryptionKey" value="${config.encryption.encryptionKey || ''}" placeholder="Leave empty to use default">
                  <div class="description">Custom encryption key (optional)</div>
                </div>
              </div>
            </form>
          </div>

          <div class="buttons">
            <button type="button" class="btn btn-danger" onclick="resetToDefault()">Reset to Default</button>
            <button type="button" class="btn btn-secondary" onclick="cancel()">Cancel</button>
            <button type="submit" class="btn btn-primary" onclick="saveConfig()">Save Configuration</button>
          </div>
        </div>

        <script>
          const vscode = acquireVsCodeApi();

          // Handle form submission
          document.getElementById('configForm').addEventListener('submit', function(e) {
            e.preventDefault();
            saveConfig();
          });

          function saveConfig() {
            const formData = new FormData(document.getElementById('configForm'));
            const config = {
              version: formData.get('version'),
              ide: formData.get('ide'),
              storagePath: formData.get('storagePath'),
              encryption: {
                enabled: formData.get('encryption.enabled') === 'on',
                encryptionKey: formData.get('encryption.encryptionKey') || undefined
              },
              logger: {
                level: 'LOG',
                sinks: ['console'],
                filePath: undefined
              },
              experimental: {}
            };

            vscode.postMessage({
              command: 'saveConfig',
              config: config
            });
          }

          function cancel() {
            vscode.postMessage({
              command: 'cancel'
            });
          }

          function resetToDefault() {
            vscode.postMessage({
              command: 'resetToDefault'
            });
          }
        </script>
      </body>
      </html>
    `;
  }
}
