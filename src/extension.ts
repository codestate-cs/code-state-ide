// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// Initialize console overrides for production
import './shared/utils/Logger';

import { RefreshConfigCommand } from './presentation/commands/RefreshConfigCommand';
import { EditConfigCommand } from './presentation/commands/EditConfigCommand';
import { SaveSessionCommand } from './presentation/commands/SaveSessionCommand';
import { ResumeSessionCommand } from './presentation/commands/ResumeSessionCommand';
import { UpdateSessionCommand } from './presentation/commands/UpdateSessionCommand';
import { ListSessionsCommand } from './presentation/commands/ListSessionsCommand';
import { DeleteSessionCommand } from './presentation/commands/DeleteSessionCommand';
import { DebugSessionsCommand } from './presentation/commands/DebugSessionsCommand';
import { AddScriptCommand } from './presentation/commands/AddScriptCommand';
import { RefreshLoggerCommand } from './presentation/commands/RefreshLoggerCommand';
import { CreateSessionWebviewProvider } from './presentation/webviews/CreateSessionWebviewProvider';
import { CreateScriptWebviewProvider } from './presentation/webviews/CreateScriptWebviewProvider';
import { ConfigTreeDataProvider } from './presentation/views/ConfigTreeDataProvider';
import { SessionsTreeViewProvider } from './presentation/views/SessionsTreeViewProvider';
import { StatusBarProvider } from './presentation/views/StatusBarProvider';
import { ErrorHandler } from './shared/errors/ErrorHandler';
import { ExtensionError, ErrorContext } from './shared/errors/ExtensionError';
import { Messages } from './shared/constants/Messages';

export async function activate(context: vscode.ExtensionContext) {
  console.log('CodeState IDE extension is now active!');

  try {
    // Initialize error handler
    const errorHandler = ErrorHandler.getInstance();
    console.log('Error handler initialized');

    // Register tree view providers
    console.log('Registering tree view providers...');
    
    const configTreeProvider = new ConfigTreeDataProvider();
    const configTreeView = vscode.window.createTreeView('codestateConfig', {
      treeDataProvider: configTreeProvider
    });
    console.log('Config tree view provider registered');
    
    // Register sessions tree view provider
    const sessionsTreeViewProvider = new SessionsTreeViewProvider(context);
    console.log('Sessions tree view provider registered');
    
    // Register status bar provider
    const statusBarProvider = new StatusBarProvider();
    await statusBarProvider.updateSessionCount();
    console.log('Status bar provider registered');
    
    context.subscriptions.push(configTreeView, statusBarProvider);
    console.log('Tree view disposables added to context subscriptions');

    // Register config commands
    const refreshConfigDisposable = RefreshConfigCommand.register(context, configTreeProvider);
    const editConfigDisposable = EditConfigCommand.register(context);
    
    // Register session commands
    const saveSessionDisposable = SaveSessionCommand.register(context);
    const resumeSessionDisposable = ResumeSessionCommand.register(context);
    const updateSessionDisposable = UpdateSessionCommand.register(context);
    const listSessionsDisposable = ListSessionsCommand.register(context);
    const deleteSessionDisposable = DeleteSessionCommand.register(context);
    const debugSessionsDisposable = DebugSessionsCommand.register(context);
    const addScriptDisposable = AddScriptCommand.register(context);
    const refreshLoggerDisposable = RefreshLoggerCommand.register(context);
    
    // Register webview commands
    const createSessionWebviewProvider = new CreateSessionWebviewProvider();
    const createScriptWebviewProvider = new CreateScriptWebviewProvider();
    
    const createSessionDisposable = vscode.commands.registerCommand('codestate.createSession', () => {
      createSessionWebviewProvider.show();
    });
    
    const createScriptDisposable = vscode.commands.registerCommand('codestate.createScript', () => {
      createScriptWebviewProvider.show();
    });
    
    context.subscriptions.push(
      refreshConfigDisposable, 
      editConfigDisposable,
      saveSessionDisposable,
      resumeSessionDisposable,
      updateSessionDisposable,
      listSessionsDisposable,
      deleteSessionDisposable,
      debugSessionsDisposable,
      addScriptDisposable,
      refreshLoggerDisposable,
      createSessionDisposable,
      createScriptDisposable
    );
    console.log('Commands registered');

    // Listen for configuration changes to update logger
    const configChangeListener = vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('codestate.logging')) {
        // Import logger dynamically to avoid circular dependency
        import('./shared/utils/Logger.js').then(({ logger }) => {
          logger.updateFromSettings();
        });
      }
    });

    context.subscriptions.push(configChangeListener);

    console.log('CodeState IDE extension activation completed successfully');

  } catch (error) {
    const extensionError = error instanceof ExtensionError ? error : ExtensionError.fromError(
      error instanceof Error ? error : new Error(String(error)),
      undefined,
      ErrorContext.CONFIGURATION
    );
    
    ErrorHandler.getInstance().handleError(extensionError, ErrorContext.CONFIGURATION, true);
    
    // Show error message to user
    vscode.window.showErrorMessage(
      'Failed to activate CodeState IDE extension. Check the output panel for details.',
      'Show Details',
      'Dismiss'
    ).then(selection => {
      if (selection === 'Show Details') {
        ErrorHandler.getInstance().showOutputChannel();
      }
    });
  }
}

export function deactivate() {
  console.log('CodeState IDE extension is now deactivated');
  
  // Clean up error handler
  try {
    ErrorHandler.getInstance().dispose();
  } catch (error) {
    console.error('Error during extension deactivation:', error);
  }
}
