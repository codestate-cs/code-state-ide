import * as vscode from 'vscode';
import * as path from 'path';

export class HelpWebviewProvider {
  private static instance: HelpWebviewProvider;
  private extensionPath: string;

  private constructor(extensionPath: string) {
    this.extensionPath = extensionPath;
  }

  static getInstance(extensionPath?: string): HelpWebviewProvider {
    if (!HelpWebviewProvider.instance) {
      if (!extensionPath) {
        throw new Error('Extension path is required for first initialization');
      }
      HelpWebviewProvider.instance = new HelpWebviewProvider(extensionPath);
    }
    return HelpWebviewProvider.instance;
  }

  /**
   * Resolve webview for the Activity Bar view
   */
  resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext<unknown>,
    _token: vscode.CancellationToken
  ): void | Thenable<void> {
    // Configure webview
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.file(path.join(this.extensionPath, 'resources'))
      ]
    };

    // Set HTML content
    webviewView.webview.html = this.getHelpHtml(this.extensionPath, webviewView.webview);

    // Handle messages from webview
    webviewView.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case 'openFullPage':
            vscode.commands.executeCommand('code-state-ide.openFullPage');
            break;
          case 'openUrl':
            if (message.url) {
              vscode.env.openExternal(vscode.Uri.parse(message.url));
            }
            break;
        }
      },
      undefined,
      []
    );
  }

  /**
   * Generate HTML content for help webview
   */
  private getHelpHtml(extensionPath: string, webview: vscode.Webview): string {
    const iconUri = webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, 'resources', 'icon.svg')));

    return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CodeState Help</title>
        <style>
          body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            margin: 0;
            line-height: 1.5;
            display: flex;
            flex-direction: column;
            min-height: 100vh;
          }
          
          .content {
            flex: 1;
          }
          
          .footer {
            margin-top: auto;
            padding-top: 12px;
            padding-bottom: 12px;
            border-top: 1px solid var(--vscode-panel-border);
            text-align: center;
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
          }
          
          .header {
            display: flex;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 12px;
            padding-top: 12px;
            border-bottom: 1px solid var(--vscode-panel-border);
          }
          
          
          .title {
            font-size: 16px;
            font-weight: 600;
            color: var(--vscode-foreground);
          }
          
          .section {
            margin-bottom: 20px;
          }
          
          .section-title {
            font-size: 14px;
            font-weight: 600;
            color: var(--vscode-foreground);
            margin-bottom: 8px;
          }
          
          .button {
            display: block;
            width: 100%;
            padding: 8px 12px;
            margin-bottom: 8px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            text-align: left;
            transition: background-color 0.2s;
          }
          
          .button:hover {
            background-color: var(--vscode-button-hoverBackground);
          }
          
          .button.secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
          }
          
          .button.secondary:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
          }
          
          .link {
            color: var(--vscode-textLink-foreground);
            text-decoration: none;
            cursor: pointer;
          }
          
          .link:hover {
            text-decoration: underline;
          }
          
          .description {
            font-size: 14px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 12px;
          }
        </style>
      </head>
      <body>
        <div class="content">
          <div class="header">
            <div class="title">CodeState</div>
          </div>
          
          <div class="description">
            Development session management for VS Code & compatible IDEs
          </div>
          
          <div class="section">
            <div class="section-title">Quick Actions</div>
            <button class="button" onclick="openFullPage()">
              🚀 Open CodeState
            </button>
          </div>
          
          <div class="section">
            <div class="section-title">Help & Support</div>
            <button class="button secondary" onclick="openUrl('https://github.com/codestate-cs/codestate-ui/issues')">
              🐛 Report Issues
            </button>
            <button class="button secondary" onclick="openUrl('https://github.com/codestate-cs/codestate-ui/discussions')">
              💬 Discussions
            </button>
            <button class="button secondary" onclick="openUrl('https://github.com/codestate-cs/codestate-ui/wiki')">
              📚 Documentation
            </button>
          </div>
          
          <div class="section">
            <div class="section-title">Contributing</div>
            <button class="button secondary" onclick="openUrl('https://github.com/codestate-cs/codestate-ui/blob/main/CONTRIBUTING.md')">
              🤝 Contributing Guide
            </button>
            <button class="button secondary" onclick="openUrl('https://github.com/codestate-cs/codestate-ui')">
              ⭐ Star on GitHub
            </button>
          </div>
        </div>
        
        <div class="footer">
          Made with ❤️ in India for developers
        </div>
        
        <script>
          const vscode = acquireVsCodeApi();
          
          function openFullPage() {
            vscode.postMessage({
              command: 'openFullPage'
            });
          }
          
          function openUrl(url) {
            vscode.postMessage({
              command: 'openUrl',
              url: url
            });
          }
        </script>
      </body>
    </html>`;
  }
}