import * as vscode from 'vscode';
import { ListSessions, Session } from 'codestate-core';
import { ErrorHandler } from '../../shared/errors/ErrorHandler';
import { ExtensionError, ErrorContext } from '../../shared/errors/ExtensionError';

export class ListSessionsCommand {
  private static errorHandler: ErrorHandler;

  static async execute(): Promise<void> {
    try {
      if (!this.errorHandler) {
        this.errorHandler = ErrorHandler.getInstance();
      }

      // Get current workspace
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        throw new Error('No workspace folder is open');
      }

      const projectRoot = workspaceFolders[0].uri.fsPath;

      // Show progress
      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Loading sessions...',
        cancellable: false
      }, async (progress) => {
        progress.report({ message: 'Fetching sessions...', increment: 50 });

        // Get sessions using codestate-core
        const listSessions = new ListSessions();
        const result = await listSessions.execute({
          search: projectRoot
        });

        if (!result.ok) {
          throw new Error('Failed to load sessions');
        }

        const sessions = result.value.filter(session => 
          session.projectRoot === projectRoot
        );

        progress.report({ message: 'Displaying sessions...', increment: 50 });

        // Display sessions in a new document
        const content = this.formatSessionsList(sessions, projectRoot);
        const document = await vscode.workspace.openTextDocument({
          content,
          language: 'markdown'
        });

        await vscode.window.showTextDocument(document);
      });

    } catch (error) {
      const extensionError = error instanceof ExtensionError ? error : ExtensionError.fromError(
        error instanceof Error ? error : new Error(String(error)),
        undefined,
        ErrorContext.CONFIGURATION
      );
      
      this.errorHandler.handleError(extensionError, ErrorContext.CONFIGURATION, true);
      
      vscode.window.showErrorMessage(
        'Failed to list sessions. Check the output panel for details.',
        'Show Details',
        'Dismiss'
      ).then(selection => {
        if (selection === 'Show Details') {
          this.errorHandler.showOutputChannel();
        }
      });
    }
  }

  private static formatSessionsList(sessions: Session[], projectRoot: string): string {
    const projectName = projectRoot.split('/').pop() || projectRoot;
    
    let content = `# Sessions for ${projectName}\n\n`;
    content += `**Project Root:** ${projectRoot}\n\n`;
    content += `**Total Sessions:** ${sessions.length}\n\n`;

    if (sessions.length === 0) {
      content += 'No sessions found for this project.\n';
      content += 'Use "CodeState: Save Session" to create your first session.\n';
      return content;
    }

    // Group sessions by tags
    const sessionsByTag = new Map<string, Session[]>();
    const untaggedSessions: Session[] = [];

    for (const session of sessions) {
      if (session.tags.length === 0) {
        untaggedSessions.push(session);
      } else {
        for (const tag of session.tags) {
          if (!sessionsByTag.has(tag)) {
            sessionsByTag.set(tag, []);
          }
          sessionsByTag.get(tag)!.push(session);
        }
      }
    }

    // Display tagged sessions
    for (const [tag, tagSessions] of sessionsByTag) {
      content += `## 🏷️ ${tag}\n\n`;
      
      for (const session of tagSessions) {
        content += this.formatSessionItem(session);
      }
      content += '\n';
    }

    // Display untagged sessions
    if (untaggedSessions.length > 0) {
      content += `## 📄 Untagged Sessions\n\n`;
      
      for (const session of untaggedSessions) {
        content += this.formatSessionItem(session);
      }
      content += '\n';
    }

    return content;
  }

  private static formatSessionItem(session: Session): string {
    const icon = this.getSessionIcon(session);
    const timeAgo = this.getTimeAgo(session.updatedAt);
    const filesCount = session.files.length;
    
    let item = `### ${icon} ${session.name}\n\n`;
    item += `- **ID:** ${session.id}\n`;
    item += `- **Updated:** ${timeAgo}\n`;
    item += `- **Files:** ${filesCount} open files\n`;
    
    if (session.notes) {
      item += `- **Notes:** ${session.notes}\n`;
    }
    
    if (session.tags.length > 0) {
      item += `- **Tags:** ${session.tags.map(tag => `\`${tag}\``).join(', ')}\n`;
    }
    
    item += `- **Git Branch:** ${session.git.branch}\n`;
    item += `- **Git Commit:** ${session.git.commit.substring(0, 8)}\n`;
    
    if (filesCount > 0) {
      item += `- **Open Files:**\n`;
      for (const file of session.files.slice(0, 5)) { // Show first 5 files
        const fileName = file.path.split('/').pop() || file.path;
        const activeIndicator = file.isActive ? ' (active)' : '';
        item += `  - ${fileName}${activeIndicator}\n`;
      }
      if (filesCount > 5) {
        item += `  - ... and ${filesCount - 5} more files\n`;
      }
    }
    
    item += '\n';
    return item;
  }

  private static getSessionIcon(session: Session): string {
    // Determine icon based on session name or tags
    const name = session.name.toLowerCase();
    const tags = session.tags.map(tag => tag.toLowerCase());
    
    if (name.includes('feature') || tags.includes('feature')) {return '🚀';}
    if (name.includes('bug') || name.includes('fix') || tags.includes('bug')) {return '🐛';}
    if (name.includes('refactor') || tags.includes('refactor')) {return '📝';}
    if (name.includes('setup') || tags.includes('setup')) {return '🔧';}
    if (name.includes('ui') || name.includes('design') || tags.includes('ui')) {return '🎨';}
    if (name.includes('doc') || tags.includes('doc')) {return '📚';}
    if (name.includes('test') || tags.includes('test')) {return '🧪';}
    
    return '📄';
  }

  private static getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) {return 'Just now';}
    if (diffInMinutes < 60) {return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;}
    if (diffInHours < 24) {return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;}
    if (diffInDays < 7) {return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;}
    
    return date.toLocaleDateString();
  }

  static register(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.commands.registerCommand('codestate.listSessions', () => {
      this.execute();
    });
  }
}
