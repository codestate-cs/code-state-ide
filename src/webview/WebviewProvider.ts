import * as vscode from 'vscode';
import * as path from 'path';
import { MessageHandler } from '../handlers/MessageHandler';
import { MessageRequest } from '../types';

export class WebviewProvider {
  private static instance: WebviewProvider;
  private messageHandler: MessageHandler;

  private constructor() {
    this.messageHandler = MessageHandler.getInstance();
  }

  static getInstance(): WebviewProvider {
    if (!WebviewProvider.instance) {
      WebviewProvider.instance = new WebviewProvider();
    }
    return WebviewProvider.instance;
  }

  /**
   * Create and configure webview panel
   */
  createWebviewPanel(context: vscode.ExtensionContext): vscode.WebviewPanel {
    const panel = vscode.window.createWebviewPanel(
      'codeStateIdeV2Webview',
      'Code State IDE v2',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(context.extensionPath, 'resources'))
        ]
      }
    );

    // Set HTML content
    panel.webview.html = this.getHtml(context, panel.webview);

    // Handle messages from webview
    panel.webview.onDidReceiveMessage(
      (message: MessageRequest) => {
        this.messageHandler.handleMessage(message, panel.webview);
      },
      undefined,
      []
    );

    return panel;
  }

  /**
   * Generate HTML content for webview
   */
  private getHtml(context: vscode.ExtensionContext, webview: vscode.Webview): string {
    // Get the URI for the CSS and JS files
    const cssUri = webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'resources', 'codesate-ui.css')));
    const jsUri = webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'resources', 'codesate-ui.iife.js')));

    return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Code State IDE v2</title>
        <link rel="stylesheet" href="${cssUri}">
      </head>
      <body>
        <codesate-ui id="app"></codesate-ui>
        <script src="${jsUri}"></script>
        <script>
          console.log('Code State IDE v2 Webview loaded');
        </script>
      </body>
    </html>`;
  }
}