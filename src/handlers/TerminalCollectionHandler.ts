import * as vscode from 'vscode';
import { CodeStateService } from '../services/CodeStateService';
import { IDETerminalService, TerminalCollection } from '../services/IDETerminalService';
import { BaseHandler } from './BaseHandler';
import {
  VSCODE_TYPES,
  RESPONSE_STATUS,
  MessageRequest,
  MessageResponse
} from '../types';
import { randomUUID } from 'crypto';

export class TerminalCollectionHandler implements BaseHandler {
  private codeStateService: CodeStateService;
  private ideTerminalService: IDETerminalService;

  constructor() {
    this.codeStateService = CodeStateService.getInstance();
    this.ideTerminalService = IDETerminalService.getInstance();
  }

  canHandle(messageType: string): boolean {
    return messageType.startsWith('codestate.terminal-collection') ||
      messageType === VSCODE_TYPES.TC_INIT;
  }

  async handleMessage(message: MessageRequest, webview: vscode.Webview): Promise<void> {
    let response: MessageResponse;

    switch (message.type) {
      case VSCODE_TYPES.TC_INIT:
        response = await this.handleTerminalCollectionsInit(message);
        break;

      case VSCODE_TYPES.TERMINAL_COLLECTION.CREATE:
        response = await this.handleTerminalCollectionCreate(message);
        break;

      case VSCODE_TYPES.TERMINAL_COLLECTION.UPDATE:
        response = await this.handleTerminalCollectionUpdate(message);
        break;

      case VSCODE_TYPES.TERMINAL_COLLECTION.DELETE:
        response = await this.handleTerminalCollectionDelete(message);
        break;

      case VSCODE_TYPES.TERMINAL_COLLECTION.RESUME:
        response = await this.handleTerminalCollectionResume(message);
        break;

      default:
        return; // Don't handle unknown message types
    }

    // Send response back to webview
    webview.postMessage(response);
  }

  /**
   * Handle terminal collections init - fetch terminal collections data
   */
  private async handleTerminalCollectionsInit(message: MessageRequest): Promise<MessageResponse> {
    console.log('handleTerminalCollectionsInit', message);
    try {
      // Use CodeStateService to get terminal collections
      const result = await this.codeStateService.getTerminalCollectionService().getTerminalCollections();

      if (result.ok) {
        return {
          type: VSCODE_TYPES.TC_INIT_RESPONSE,
          status: RESPONSE_STATUS.SUCCESS,
          payload: { terminalCollections: result.value || [] },
          id: message.id
        };
      } else {
        return {
          type: VSCODE_TYPES.TC_INIT_RESPONSE,
          status: RESPONSE_STATUS.ERROR,
          payload: { error: result.error.message },
          id: message.id
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Terminal collections init error:', error);
      return {
        type: VSCODE_TYPES.TC_INIT_RESPONSE,
        status: RESPONSE_STATUS.ERROR,
        payload: { error: errorMessage },
        id: message.id
      };
    }
  }

  /**
   * Handle terminal collection creation
   */
  private async handleTerminalCollectionCreate(message: MessageRequest): Promise<MessageResponse> {
    console.log('handleTerminalCollectionCreate', message);
    try {
      const terminalCollectionData = message.payload?.terminalCollectionData;
      if (!terminalCollectionData) {
        vscode.window.showErrorMessage('No terminal collection data provided');
        return {
          type: VSCODE_TYPES.TERMINAL_COLLECTION.CREATE_RESPONSE,
          status: RESPONSE_STATUS.ERROR,
          payload: { success: false, error: 'No terminal collection data provided' },
          id: message.id
        };
      }

      const id = randomUUID();

      // Use CodeStateService to create the terminal collection
      const terminalCollection: TerminalCollection = {
        id,
        name: terminalCollectionData.name,
        rootPath: terminalCollectionData.rootPath,
        lifecycle: terminalCollectionData.lifecycle || ['open'],
        scriptReferences: terminalCollectionData.scriptReferences,
        closeTerminalAfterExecution: terminalCollectionData.closeTerminalAfterExecution || false,
        executionMode: terminalCollectionData.executionMode
      };

      const result = await this.codeStateService.getTerminalCollectionService().createTerminalCollection(terminalCollection as any);

      if (result.ok) {
        console.log(`Terminal collection "${terminalCollectionData.name}" created with executionMode: ${terminalCollection.executionMode}`);
        vscode.window.showInformationMessage(`Terminal collection "${terminalCollectionData.name}" created successfully!`);
        return {
          type: VSCODE_TYPES.TERMINAL_COLLECTION.CREATE_RESPONSE,
          status: RESPONSE_STATUS.SUCCESS,
          payload: { success: true, id },
          id: message.id
        };
      } else {
        vscode.window.showErrorMessage(`Failed to create terminal collection: ${result.error.message}`);
        return {
          type: VSCODE_TYPES.TERMINAL_COLLECTION.CREATE_RESPONSE,
          status: RESPONSE_STATUS.ERROR,
          payload: { success: false, error: result.error.message },
          id: message.id
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Terminal collection creation error:', error);
      vscode.window.showErrorMessage(`Terminal collection creation failed: ${errorMessage}`);
      return {
        type: VSCODE_TYPES.TERMINAL_COLLECTION.CREATE_RESPONSE,
        status: RESPONSE_STATUS.ERROR,
        payload: { success: false, error: errorMessage },
        id: message.id
      };
    }
  }

  /**
   * Handle terminal collection deletion
   */
  private async handleTerminalCollectionDelete(message: MessageRequest): Promise<MessageResponse> {
    console.log('handleTerminalCollectionDelete', message);
    try {
      const terminalCollectionId = message.payload?.id;
      if (!terminalCollectionId) {
        vscode.window.showErrorMessage('No terminal collection ID provided');
        return {
          type: VSCODE_TYPES.TERMINAL_COLLECTION.DELETE_RESPONSE,
          status: RESPONSE_STATUS.ERROR,
          payload: { success: false, error: 'No terminal collection ID provided' },
          id: message.id
        };
      }

      // Use CodeStateService to delete the terminal collection
      const result = await this.codeStateService.getTerminalCollectionService().deleteTerminalCollection(terminalCollectionId);

      if (result.ok) {
        vscode.window.showInformationMessage('Terminal collection deleted successfully!');
        return {
          type: VSCODE_TYPES.TERMINAL_COLLECTION.DELETE_RESPONSE,
          status: RESPONSE_STATUS.SUCCESS,
          payload: { success: true, id: terminalCollectionId },
          id: message.id
        };
      } else {
        vscode.window.showErrorMessage(`Failed to delete terminal collection: ${result.error.message}`);
        return {
          type: VSCODE_TYPES.TERMINAL_COLLECTION.DELETE_RESPONSE,
          status: RESPONSE_STATUS.ERROR,
          payload: { success: false, error: result.error.message },
          id: message.id
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Terminal collection deletion error:', error);
      vscode.window.showErrorMessage(`Terminal collection deletion failed: ${errorMessage}`);
      return {
        type: VSCODE_TYPES.TERMINAL_COLLECTION.DELETE_RESPONSE,
        status: RESPONSE_STATUS.ERROR,
        payload: { success: false, error: errorMessage },
        id: message.id
      };
    }
  }

  /**
   * Handle terminal collection resume
   */
  private async handleTerminalCollectionResume(message: MessageRequest): Promise<MessageResponse> {
    console.log('handleTerminalCollectionResume', message);
    try {
      const terminalCollectionId = message.payload?.id;
      if (!terminalCollectionId) {
        vscode.window.showErrorMessage('No terminal collection ID provided');
        return {
          type: VSCODE_TYPES.TERMINAL_COLLECTION.RESUME_RESPONSE,
          status: RESPONSE_STATUS.ERROR,
          payload: { success: false, error: 'No terminal collection ID provided' },
          id: message.id
        };
      }

      // Get terminal collection details to check executionMode
      const terminalCollectionsResult = await this.codeStateService.getTerminalCollectionService().getTerminalCollections();
      if (!terminalCollectionsResult.ok) {
        vscode.window.showErrorMessage(`Failed to get terminal collection: ${terminalCollectionsResult.error.message}`);
        return {
          type: VSCODE_TYPES.TERMINAL_COLLECTION.RESUME_RESPONSE,
          status: RESPONSE_STATUS.ERROR,
          payload: { success: false, error: terminalCollectionsResult.error.message },
          id: message.id
        };
      }

      const terminalCollection = terminalCollectionsResult.value.find((tc: any) => tc.id === terminalCollectionId);
      if (!terminalCollection) {
        vscode.window.showErrorMessage('Terminal collection not found');
        return {
          type: VSCODE_TYPES.TERMINAL_COLLECTION.RESUME_RESPONSE,
          status: RESPONSE_STATUS.ERROR,
          payload: { success: false, error: 'Terminal collection not found' },
          id: message.id
        };
      }

      console.log('Terminal collection data:', JSON.stringify(terminalCollection, null, 2));

      // Check executionMode and execute accordingly
      if (terminalCollection.executionMode === 'ide') {
        console.log(`Executing terminal collection "${terminalCollection.name}" in IDE mode`);
        // Execute in IDE terminals
        await this.ideTerminalService.executeTerminalCollection(terminalCollection);
        vscode.window.showInformationMessage('Terminal collection resumed successfully in IDE!');
        return {
          type: VSCODE_TYPES.TERMINAL_COLLECTION.RESUME_RESPONSE,
          status: RESPONSE_STATUS.SUCCESS,
          payload: { success: true, id: terminalCollectionId },
          id: message.id
        };
      } else {
        // Use CodeStateService to execute the terminal collection (existing behavior)
        const result = await this.codeStateService.getTerminalCollectionService().executeTerminalCollection(terminalCollectionId);

        if (result.ok) {
          vscode.window.showInformationMessage('Terminal collection resumed successfully!');
          return {
            type: VSCODE_TYPES.TERMINAL_COLLECTION.RESUME_RESPONSE,
            status: RESPONSE_STATUS.SUCCESS,
            payload: { success: true, id: terminalCollectionId },
            id: message.id
          };
        } else {
          vscode.window.showErrorMessage(`Failed to resume terminal collection: ${result.error.message}`);
          return {
            type: VSCODE_TYPES.TERMINAL_COLLECTION.RESUME_RESPONSE,
            status: RESPONSE_STATUS.ERROR,
            payload: { success: false, error: result.error.message },
            id: message.id
          };
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Terminal collection resume error:', error);
      vscode.window.showErrorMessage(`Terminal collection resume failed: ${errorMessage}`);
      return {
        type: VSCODE_TYPES.TERMINAL_COLLECTION.RESUME_RESPONSE,
        status: RESPONSE_STATUS.ERROR,
        payload: { success: false, error: errorMessage },
        id: message.id
      };
    }
  }

  /**
   * Handle terminal collection update
   */
  private async handleTerminalCollectionUpdate(message: MessageRequest): Promise<MessageResponse> {
    console.log('handleTerminalCollectionUpdate', message);
    try {
      const terminalCollectionId = message.payload?.id;
      const terminalCollectionData = message.payload?.terminalCollectionData;
      console.log('terminalCollectionData', terminalCollectionId, terminalCollectionData);
      if (!terminalCollectionId) {
        vscode.window.showErrorMessage('No terminal collection ID provided');
        return {
          type: VSCODE_TYPES.TERMINAL_COLLECTION.UPDATE_RESPONSE,
          status: RESPONSE_STATUS.ERROR,
          payload: { success: false, error: 'No terminal collection ID provided' },
          id: message.id
        };
      }

      if (!terminalCollectionData) {
        vscode.window.showErrorMessage('No terminal collection data provided');
        return {
          type: VSCODE_TYPES.TERMINAL_COLLECTION.UPDATE_RESPONSE,
          status: RESPONSE_STATUS.ERROR,
          payload: { success: false, error: 'No terminal collection data provided' },
          id: message.id
        };
      }

      // Ensure executionMode is preserved
      const updateData = {
        ...terminalCollectionData,
        executionMode: terminalCollectionData.executionMode
      };

      // Use CodeStateService to update the terminal collection
      const result = await this.codeStateService.getTerminalCollectionService().updateTerminalCollection(
        terminalCollectionId,
        updateData
      );

      if (result.ok) {
        vscode.window.showInformationMessage(`Terminal collection "${terminalCollectionData.name}" updated successfully!`);
        return {
          type: VSCODE_TYPES.TERMINAL_COLLECTION.UPDATE_RESPONSE,
          status: RESPONSE_STATUS.SUCCESS,
          payload: { success: true, id: terminalCollectionId },
          id: message.id
        };
      } else {
        vscode.window.showErrorMessage(`Failed to update terminal collection: ${result.error.message}`);
        return {
          type: VSCODE_TYPES.TERMINAL_COLLECTION.UPDATE_RESPONSE,
          status: RESPONSE_STATUS.ERROR,
          payload: { success: false, error: result.error.message },
          id: message.id
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Terminal collection update error:', error);
      vscode.window.showErrorMessage(`Terminal collection update failed: ${errorMessage}`);
      return {
        type: VSCODE_TYPES.TERMINAL_COLLECTION.UPDATE_RESPONSE,
        status: RESPONSE_STATUS.ERROR,
        payload: { success: false, error: errorMessage },
        id: message.id
      };
    }
  }
}