import * as vscode from 'vscode';
import { BaseHandler } from './BaseHandler';
import { 
  VSCODE_TYPES, 
  RESPONSE_STATUS, 
  MessageRequest, 
  MessageResponse
} from '../types';

export class UIHandler implements BaseHandler {
  canHandle(messageType: string): boolean {
    return messageType === VSCODE_TYPES.UI_READY;
  }

  async handleMessage(message: MessageRequest, webview: vscode.Webview): Promise<void> {
    let response: MessageResponse;

    switch (message.type) {
      case VSCODE_TYPES.UI_READY:
        response = await this.handleUIReady(message);
        break;
      
      default:
        return; // Don't handle unknown message types
    }

    // Send response back to webview
    webview.postMessage(response);
  }

  /**
   * Handle UI ready handshake
   */
  private async handleUIReady(message: MessageRequest): Promise<MessageResponse> {
    // Just acknowledge that UI is ready
    return {
      type: 'ui-ready-ack',
      status: RESPONSE_STATUS.SUCCESS,
      payload: { message: 'UI ready acknowledged' },
      id: message.id
    };
  }
}