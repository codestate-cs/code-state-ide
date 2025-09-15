import * as vscode from 'vscode';
import { WebviewProvider } from './webview/WebviewProvider';
import { HelpWebviewProvider } from './webview/HelpWebviewProvider';
import { Logger } from './utils/logger';
import { AutoResumeService } from './services/AutoResumeService';

export function activate(context: vscode.ExtensionContext) {
  const logger = Logger.getInstance('Extension');
  logger.log('Code State IDE extension activated');

  // Get webview provider instance
  const webviewProvider = WebviewProvider.getInstance();
  const helpWebviewProvider = HelpWebviewProvider.getInstance(context.extensionPath);

  // Register webview view provider for Activity Bar
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('codestate-ide-view', helpWebviewProvider)
  );


  // Auto-resume scripts and terminal collections with 'open' lifecycle
  const autoResumeService = AutoResumeService.getInstance();
  autoResumeService.autoResumeForCurrentWorkspace().catch(error => {
    logger.log(`Auto-resume failed during activation: ${error instanceof Error ? error.message : 'Unknown error'}`);
  });

  // Create status bar item
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.text = "$(code) CodeState";
  statusBarItem.tooltip = "Open CodeState";
  statusBarItem.command = 'code-state-ide.openFullPage';
  statusBarItem.show();

  // Main command → opens the full editor webview
  context.subscriptions.push(
    vscode.commands.registerCommand('code-state-ide.openFullPage', async () => {
      logger.log('Opening CodeState IDE webview');
      
      // Create webview panel using the provider
      const panel = webviewProvider.createWebviewPanel(context);
    })
  );

  // Add status bar item to subscriptions
  context.subscriptions.push(statusBarItem);
}
