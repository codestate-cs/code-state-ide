import * as vscode from 'vscode';
import { WebviewProvider } from './webview/WebviewProvider';
import { Logger } from './utils/logger';
import { AutoResumeService } from './services/AutoResumeService';

export function activate(context: vscode.ExtensionContext) {
  const logger = Logger.getInstance('Extension');
  logger.log('Code State IDE v2 extension activated');

  // Get webview provider instance
  const webviewProvider = WebviewProvider.getInstance();

  // Auto-resume scripts and terminal collections with 'open' lifecycle
  const autoResumeService = AutoResumeService.getInstance();
  autoResumeService.autoResumeForCurrentWorkspace().catch(error => {
    logger.log(`Auto-resume failed during activation: ${error instanceof Error ? error.message : 'Unknown error'}`);
  });

  // Create status bar item
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.text = "$(code) Code State IDE";
  statusBarItem.tooltip = "Open Code State IDE v2";
  statusBarItem.command = 'code-state-ide-v2.openFullPage';
  statusBarItem.show();

  // Main command → opens the full editor webview
  context.subscriptions.push(
    vscode.commands.registerCommand('code-state-ide-v2.openFullPage', async () => {
      logger.log('Opening Code State IDE v2 webview');
      
      // Create webview panel using the provider
      const panel = webviewProvider.createWebviewPanel(context);

      // Optional: collapse sidebar for "fullscreen" feel
      await vscode.commands.executeCommand('workbench.action.closeSidebar');
    })
  );

  // Add status bar item to subscriptions
  context.subscriptions.push(statusBarItem);
}
