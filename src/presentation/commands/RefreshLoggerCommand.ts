import * as vscode from 'vscode';
import { logger } from '../../shared/utils/Logger';

export class RefreshLoggerCommand {
  static register(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.commands.registerCommand('codestate.refreshLogger', () => {
      logger.updateFromSettings();
    });
  }
}
