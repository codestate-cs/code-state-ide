import * as vscode from 'vscode';
import { BaseHandler } from './BaseHandler';
import { SessionHandler } from './SessionHandler';
import { ScriptHandler } from './ScriptHandler';
import { TerminalCollectionHandler } from './TerminalCollectionHandler';
import { ConfigHandler } from './ConfigHandler';
import { UIHandler } from './UIHandler';
import {
  VSCODE_TYPES,
  RESPONSE_STATUS,
  MessageRequest,
  MessageResponse
} from '../types';

export class MessageHandler {
  private static instance: MessageHandler;
  private handlers: BaseHandler[];

  private constructor() {
    this.handlers = [
      new SessionHandler(),
      new ScriptHandler(),
      new TerminalCollectionHandler(),
      new ConfigHandler(),
      new UIHandler()
    ];
  }

  static getInstance(): MessageHandler {
    if (!MessageHandler.instance) {
      MessageHandler.instance = new MessageHandler();
    }
    return MessageHandler.instance;
  }

  /**
   * Handle incoming messages from webview
   */
  async handleMessage(message: MessageRequest, webview: vscode.Webview): Promise<void> {
    try {
      console.log('MessageHandler: Handling message', message.type);

      // Find the appropriate handler
      const handler = this.handlers.find(h => h.canHandle(message.type));

      console.log('MessageHandler: Found handler for', message.type, handler ? handler.constructor.name : 'none');

      if (handler) {
        await handler.handleMessage(message, webview);
      } else {
        console.log('MessageHandler: No handler found for message type:', message.type);
        // Handle unknown message types
        const errorResponse: MessageResponse = {
          type: message.type + '.response',
          status: RESPONSE_STATUS.ERROR,
          payload: { error: `Unknown message type: ${message.type}` },
          id: message.id
        };
        webview.postMessage(errorResponse);
      }
    } catch (error) {
      console.error('MessageHandler: Error handling message:', error);
      // Global error handling
      const errorResponse: MessageResponse = {
        type: message.type + '.response',
        status: RESPONSE_STATUS.ERROR,
        payload: { error: error instanceof Error ? error.message : 'Unknown error occurred' },
        id: message.id
      };
      webview.postMessage(errorResponse);
    }
  }
}