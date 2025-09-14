import * as vscode from 'vscode';
import { CodeStateService } from '../services/CodeStateService';
import { SessionDataCollector } from '../services/SessionDataCollector';
import { GitValidationService } from '../services/GitValidationService';
import { BaseHandler } from './BaseHandler';
import { 
  VSCODE_TYPES, 
  RESPONSE_STATUS, 
  MessageRequest, 
  MessageResponse
} from '../types';

export class SessionHandler implements BaseHandler {
  private codeStateService: CodeStateService;
  private sessionDataCollector: SessionDataCollector;
  private gitValidationService: GitValidationService;

  constructor() {
    this.codeStateService = CodeStateService.getInstance();
    this.sessionDataCollector = new SessionDataCollector();
    this.gitValidationService = new GitValidationService();
  }

  canHandle(messageType: string): boolean {
    return messageType.startsWith('codestate.session') || 
           messageType === VSCODE_TYPES.SESSIONS_INIT;
  }

  async handleMessage(message: MessageRequest, webview: vscode.Webview): Promise<void> {
    let response: MessageResponse;

    switch (message.type) {
      case VSCODE_TYPES.SESSIONS_INIT:
        await this.handleSessionsInit(message, webview);
        return; // This method handles its own response via webview.postMessage
      
      case VSCODE_TYPES.SESSION.CREATE_INIT:
        await this.handleSessionCreateInit(message, webview);
        return; // This method handles its own response via webview.postMessage
      
      case VSCODE_TYPES.SESSION.CREATE:
        response = await this.handleSessionCreate(message);
        break;
      
      case VSCODE_TYPES.SESSION.UPDATE:
        response = await this.handleSessionUpdate(message);
        break;
      
      case VSCODE_TYPES.SESSION.DELETE:
        response = await this.handleSessionDelete(message);
        break;
      
      case VSCODE_TYPES.SESSION.RESUME:
        response = await this.handleSessionResume(message);
        console.log('handleSessionResume response:', response);
        break;
      
      case 'codestate.session.export':
        response = await this.handleSessionExport(message);
        break;
      
      default:
        return; // Don't handle unknown message types
    }

    // Send response back to webview
    webview.postMessage(response);
  }

  /**
   * Handle sessions init - fetch sessions data
   */
  private async handleSessionsInit(message: MessageRequest, webview: vscode.Webview): Promise<void> {
    const result = await this.codeStateService.getSessionService().listSessions({ loadAll: true });
    console.log('handleSessionsInit', result);
    
    // Get current workspace root
    const currentProjectRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || null;
    console.log('handleSessionsInit: currentProjectRoot:', currentProjectRoot);
    
    if (result.ok) {
      webview.postMessage({
        type: VSCODE_TYPES.SESSIONS_INIT_RESPONSE,
        status: RESPONSE_STATUS.SUCCESS,
        payload: { 
          sessions: result.value,
          currentProjectRoot: currentProjectRoot
        },
        id: message.id
      });
    } else {
      webview.postMessage({
        type: VSCODE_TYPES.SESSIONS_INIT_RESPONSE,
        status: RESPONSE_STATUS.ERROR,
        payload: { error: result.error.message },
        id: message.id
      });
    }
  }

  /**
   * Handle session create init - collect all session data
   */
  private async handleSessionCreateInit(message: MessageRequest, webview: vscode.Webview): Promise<void> {
    console.log('handleSessionCreateInit', message);
    try {
      // Get workspace root
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        webview.postMessage({
          type: VSCODE_TYPES.SESSION.CREATE_INIT_RESPONSE,
          status: RESPONSE_STATUS.ERROR,
          payload: { error: 'No workspace folder found' },
          id: message.id
        });
        return;
      }

      const projectRoot = workspaceFolders[0].uri.fsPath;

      // Collect all session data
      const sessionDataResult = await this.sessionDataCollector.collectSessionData(projectRoot);
      if (!sessionDataResult.ok) {
        webview.postMessage({
          type: VSCODE_TYPES.SESSION.CREATE_INIT_RESPONSE,
          status: RESPONSE_STATUS.ERROR,
          payload: { error: sessionDataResult.error.message },
          id: message.id
        });
        return;
      }

      webview.postMessage({
        type: VSCODE_TYPES.SESSION.CREATE_INIT_RESPONSE,
        status: RESPONSE_STATUS.SUCCESS,
        payload: { sessionData: sessionDataResult.value },
        id: message.id
      });
    } catch (error) {
      webview.postMessage({
        type: VSCODE_TYPES.SESSION.CREATE_INIT_RESPONSE,
        status: RESPONSE_STATUS.ERROR,
        payload: { error: error instanceof Error ? error.message : 'Unknown error occurred' },
        id: message.id
      });
    }
  }

  /**
   * Handle session create
   */
  private async handleSessionCreate(message: MessageRequest): Promise<MessageResponse> {
    console.log('handleSessionCreate', message);
    try {
      const sessionData = message.payload?.sessionData;
      if (!sessionData) {
        vscode.window.showErrorMessage('No session data provided');
        return {
          type: VSCODE_TYPES.SESSION.CREATE_RESPONSE,
          status: RESPONSE_STATUS.ERROR,
          payload: { success: false, error: 'No session data provided' },
          id: message.id
        };
      }

      // Use CodeStateService to save the session
      const result = await this.codeStateService.getSessionService().saveSession({
        name: sessionData.name,
        projectRoot: sessionData.projectRoot,
        notes: sessionData.notes,
        tags: sessionData.tags,
        files: sessionData.files,
        git: sessionData.git,
        extensions: sessionData.extensions,
        terminalCommands: sessionData.terminalCommands,
        terminalCollections: sessionData.terminalCollections,
        scripts: sessionData.scripts
      });

      if (result.ok) {
        vscode.window.showInformationMessage(`Session "${sessionData.name}" created successfully!`);
        return {
          type: VSCODE_TYPES.SESSION.CREATE_RESPONSE,
          status: RESPONSE_STATUS.SUCCESS,
          payload: { success: true, id: result.value.id },
          id: message.id
        };
      } else {
        vscode.window.showErrorMessage(`Failed to create session: ${result.error.message}`);
        return {
          type: VSCODE_TYPES.SESSION.CREATE_RESPONSE,
          status: RESPONSE_STATUS.ERROR,
          payload: { success: false, error: result.error.message },
          id: message.id
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      vscode.window.showErrorMessage(`Failed to create session: ${errorMessage}`);
      return {
        type: VSCODE_TYPES.SESSION.CREATE_RESPONSE,
        status: RESPONSE_STATUS.ERROR,
        payload: { success: false, error: errorMessage },
        id: message.id
      };
    }
  }

  /**
   * Handle session update
   */
  private async handleSessionUpdate(message: MessageRequest): Promise<MessageResponse> {
    try {
      const { id, updates } = message.payload;
      
      if (!id) {
        return {
          type: VSCODE_TYPES.SESSION.UPDATE_RESPONSE,
          status: RESPONSE_STATUS.ERROR,
          payload: { error: 'Session ID is required' },
          id: message.id
        };
      }

      const result = await this.codeStateService.getSessionService().updateSession(id, updates);
      
      if (result.ok) {
        vscode.window.showInformationMessage(`Session "${result.value.name}" updated successfully`);
        return {
          type: VSCODE_TYPES.SESSION.UPDATE_RESPONSE,
          status: RESPONSE_STATUS.SUCCESS,
          payload: { session: result.value },
          id: message.id
        };
      } else {
        vscode.window.showErrorMessage(`Failed to update session: ${result.error.message}`);
        return {
          type: VSCODE_TYPES.SESSION.UPDATE_RESPONSE,
          status: RESPONSE_STATUS.ERROR,
          payload: { error: result.error.message },
          id: message.id
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      vscode.window.showErrorMessage(`Failed to update session: ${errorMessage}`);
      return {
        type: VSCODE_TYPES.SESSION.UPDATE_RESPONSE,
        status: RESPONSE_STATUS.ERROR,
        payload: { error: errorMessage },
        id: message.id
      };
    }
  }

  /**
   * Handle session delete
   */
  private async handleSessionDelete(message: MessageRequest): Promise<MessageResponse> {
    try {
      const { id } = message.payload;
      
      if (!id) {
        return {
          type: VSCODE_TYPES.SESSION.DELETE_RESPONSE,
          status: RESPONSE_STATUS.ERROR,
          payload: { error: 'Session ID is required' },
          id: message.id
        };
      }

      // Confirmation is now handled by the UI dialog
      // No need for VS Code confirmation dialog

      const result = await this.codeStateService.getSessionService().deleteSession(id);
      
      if (result.ok) {
        vscode.window.showInformationMessage('Session deleted successfully');
        return {
          type: VSCODE_TYPES.SESSION.DELETE_RESPONSE,
          status: RESPONSE_STATUS.SUCCESS,
          payload: { id },
          id: message.id
        };
      } else {
        vscode.window.showErrorMessage(`Failed to delete session: ${result.error.message}`);
        return {
          type: VSCODE_TYPES.SESSION.DELETE_RESPONSE,
          status: RESPONSE_STATUS.ERROR,
          payload: { error: result.error.message },
          id: message.id
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      vscode.window.showErrorMessage(`Failed to delete session: ${errorMessage}`);
      return {
        type: VSCODE_TYPES.SESSION.DELETE_RESPONSE,
        status: RESPONSE_STATUS.ERROR,
        payload: { error: errorMessage },
        id: message.id
      };
    }
  }

  /**
   * Handle session resume
   */
  private async handleSessionResume(message: MessageRequest): Promise<MessageResponse> {
    try {
      const { id } = message.payload;
      
      if (!id) {
        return {
          type: VSCODE_TYPES.SESSION.RESUME_RESPONSE,
          status: RESPONSE_STATUS.ERROR,
          payload: { error: 'Session ID is required' },
          id: message.id
        };
      }

      // Get current workspace root
      const currentWorkspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!currentWorkspaceRoot) {
        return {
          type: VSCODE_TYPES.SESSION.RESUME_RESPONSE,
          status: RESPONSE_STATUS.ERROR,
          payload: { error: 'No workspace folder is open' },
          id: message.id
        };
      }

      // Get session data to check project root
      const sessionsResult = await this.codeStateService.getSessionService().listSessions({ loadAll: true });
      if (!sessionsResult.ok) {
        return {
          type: VSCODE_TYPES.SESSION.RESUME_RESPONSE,
          status: RESPONSE_STATUS.ERROR,
          payload: { error: `Failed to get session data: ${sessionsResult.error.message}` },
          id: message.id
        };
      }

      const session = sessionsResult.value.find((s: any) => s.id === id);
      if (!session) {
        return {
          type: VSCODE_TYPES.SESSION.RESUME_RESPONSE,
          status: RESPONSE_STATUS.ERROR,
          payload: { error: 'Session not found' },
          id: message.id
        };
      }

      console.log('handleSessionResume: Current workspace:', currentWorkspaceRoot);
      console.log('handleSessionResume: Session project root:', session.projectRoot);

      // Determine which path to use for git validation
      const gitValidationPath = session.projectRoot === currentWorkspaceRoot 
        ? currentWorkspaceRoot 
        : session.projectRoot;

      console.log('handleSessionResume: Using git validation path:', gitValidationPath);

      // Git validation and branch switching for both same and different projects
      if (session.git && session.git.branch) {
        try {
          // Step 1: Check git state and handle uncommitted changes
          console.log('handleSessionResume: Checking git state at:', gitValidationPath);
          await this.gitValidationService.validateAndHandleGitState(gitValidationPath);
          console.log('handleSessionResume: Git validation completed successfully');

          // Step 2: Switch to session's git branch if different
          const gitExtension = vscode.extensions.getExtension('vscode.git');
          if (gitExtension && gitExtension.isActive) {
            const git = gitExtension.exports.getAPI(1);
            const repository = git.getRepository(vscode.Uri.file(gitValidationPath));
            
            if (repository && repository.state.HEAD?.name !== session.git.branch) {
              console.log(`handleSessionResume: Switching from ${repository.state.HEAD?.name} to ${session.git.branch}`);
              
              // Checkout the session's branch
              await repository.checkout(session.git.branch);
              console.log(`handleSessionResume: Successfully switched to branch ${session.git.branch}`);
            } else {
              console.log(`handleSessionResume: Already on correct branch ${session.git.branch}`);
            }
          }
        } catch (gitError) {
          console.error('handleSessionResume: Git validation or branch switch failed:', gitError);
          return {
            type: VSCODE_TYPES.SESSION.RESUME_RESPONSE,
            status: RESPONSE_STATUS.ERROR,
            payload: { error: `Git validation failed: ${gitError instanceof Error ? gitError.message : 'Unknown error'}` },
            id: message.id
          };
        }
      } else {
        console.log('handleSessionResume: No git information available, skipping git validation');
      }

      // Now resume the session
      const result = await this.codeStateService.getSessionService().resumeSession(id);
      
      if (result.ok) {
        vscode.window.showInformationMessage(`Session "${result.value.name}" resumed successfully`);
        return {
          type: VSCODE_TYPES.SESSION.RESUME_RESPONSE,
          status: RESPONSE_STATUS.SUCCESS,
          payload: { session: result.value },
          id: message.id
        };
      } else {
        vscode.window.showErrorMessage(`Failed to resume session: ${result.error.message}`);
        return {
          type: VSCODE_TYPES.SESSION.RESUME_RESPONSE,
          status: RESPONSE_STATUS.ERROR,
          payload: { error: result.error.message },
          id: message.id
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      vscode.window.showErrorMessage(`Failed to resume session: ${errorMessage}`);
      return {
        type: VSCODE_TYPES.SESSION.RESUME_RESPONSE,
        status: RESPONSE_STATUS.ERROR,
        payload: { error: errorMessage },
        id: message.id
      };
    }
  }

  /**
   * Handle session export
   */
  private async handleSessionExport(message: MessageRequest): Promise<MessageResponse> {
    try {
      const { id } = message.payload;
      
      if (!id) {
        return {
          type: 'codestate.session.export.response',
          status: RESPONSE_STATUS.ERROR,
          payload: { error: 'Session ID is required' },
          id: message.id
        };
      }

      // Get the session data
      const sessionsResult = await this.codeStateService.getSessionService().listSessions({ loadAll: true });
      
      if (!sessionsResult.ok) {
        vscode.window.showErrorMessage(`Failed to get session data: ${sessionsResult.error.message}`);
        return {
          type: 'codestate.session.export.response',
          status: RESPONSE_STATUS.ERROR,
          payload: { error: sessionsResult.error.message },
          id: message.id
        };
      }

      const session = sessionsResult.value.find((s: any) => s.id === id);
      
      if (!session) {
        vscode.window.showErrorMessage('Session not found');
        return {
          type: 'codestate.session.export.response',
          status: RESPONSE_STATUS.ERROR,
          payload: { error: 'Session not found' },
          id: message.id
        };
      }

      // Show save dialog
      const uri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file(`${session.name}-export.json`),
        filters: {
          'JSON Files': ['json'],
          'All Files': ['*']
        }
      });

      if (!uri) {
        return {
          type: 'codestate.session.export.response',
          status: RESPONSE_STATUS.ERROR,
          payload: { error: 'Export cancelled by user' },
          id: message.id
        };
      }

      // Write the session data to file
      const sessionData = JSON.stringify(session, null, 2);
      await vscode.workspace.fs.writeFile(uri, Buffer.from(sessionData, 'utf8'));

      vscode.window.showInformationMessage(`Session "${session.name}" exported successfully to ${uri.fsPath}`);
      
      return {
        type: 'codestate.session.export.response',
        status: RESPONSE_STATUS.SUCCESS,
        payload: { 
          sessionId: id,
          exportPath: uri.fsPath 
        },
        id: message.id
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      vscode.window.showErrorMessage(`Failed to export session: ${errorMessage}`);
      return {
        type: 'codestate.session.export.response',
        status: RESPONSE_STATUS.ERROR,
        payload: { error: errorMessage },
        id: message.id
      };
    }
  }
}