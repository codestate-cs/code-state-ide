import * as vscode from 'vscode';
import { BaseHandler } from './BaseHandler';
import { GetConfig, UpdateConfig } from '@codestate/core';
import { 
  VSCODE_TYPES, 
  RESPONSE_STATUS, 
  MessageRequest, 
  MessageResponse
} from '../types';

export class ConfigHandler implements BaseHandler {
  constructor() {
    // No initialization needed - GetConfig and UpdateConfig are stateless
  }

  canHandle(messageType: string): boolean {
    const canHandle = messageType === VSCODE_TYPES.CONFIG_INIT ||
                     messageType === VSCODE_TYPES.CONFIG.UPDATE;
    console.log('ConfigHandler: canHandle', messageType, canHandle);
    return canHandle;
  }

  async handleMessage(message: MessageRequest, webview: vscode.Webview): Promise<void> {
    console.log('ConfigHandler: handleMessage called', message);
    let response: MessageResponse;

    switch (message.type) {
      case VSCODE_TYPES.CONFIG_INIT:
        console.log('ConfigHandler: Handling CONFIG_INIT');
        response = await this.handleConfigInit(message);
        break;
      
      case VSCODE_TYPES.CONFIG.UPDATE:
        console.log('ConfigHandler: Handling CONFIG_UPDATE');
        response = await this.handleConfigUpdate(message);
        break;
      
      default:
        console.log('ConfigHandler: Unknown message type', message.type);
        return; // Don't handle unknown message types
    }

    console.log('ConfigHandler: Sending response', response);
    // Send response back to webview
    webview.postMessage(response);
  }

  /**
   * Handle config init - fetch current configuration
   */
  private async handleConfigInit(message: MessageRequest): Promise<MessageResponse> {
    try {
      console.log('ConfigHandler: Handling config init request', message);
      
      // Get current configuration using GetConfig class
      const getConfig = new GetConfig();
      const configResult = await getConfig.execute();
      
      if (configResult.ok) {
        const response: MessageResponse = {
          type: VSCODE_TYPES.CONFIG_INIT_RESPONSE,
          status: RESPONSE_STATUS.SUCCESS,
          payload: { 
            config: configResult.value 
          },
          id: message.id || 'unknown'
        };
        
        console.log('ConfigHandler: Config init successful');
        return response;
      } else {
        const response: MessageResponse = {
          type: VSCODE_TYPES.CONFIG_INIT_RESPONSE,
          status: RESPONSE_STATUS.ERROR,
          payload: { 
            error: configResult.error.message || 'Failed to load configuration'
          },
          id: message.id || 'unknown'
        };
        
        console.error('ConfigHandler: Config init failed:', configResult.error);
        return response;
      }
    } catch (error) {
      console.error('ConfigHandler: Config init error:', error);
      
      const response: MessageResponse = {
        type: VSCODE_TYPES.CONFIG_INIT_RESPONSE,
        status: RESPONSE_STATUS.ERROR,
        payload: { 
          error: error instanceof Error ? error.message : 'Unknown error occurred while loading configuration'
        },
        id: message.id || 'unknown'
      };
      
      return response;
    }
  }

  /**
   * Handle config update - update configuration
   */
  private async handleConfigUpdate(message: MessageRequest): Promise<MessageResponse> {
    try {
      console.log('ConfigHandler: Handling config update request');
      
      const { config } = message.payload;
      
      if (!config) {
        const response: MessageResponse = {
          type: VSCODE_TYPES.CONFIG.UPDATE_RESPONSE,
          status: RESPONSE_STATUS.ERROR,
          payload: { 
            error: 'Configuration data is required'
          },
          id: message.id || 'unknown'
        };
        
        return response;
      }
      
      // Update configuration using UpdateConfig class
      const updateConfig = new UpdateConfig();
      const updateResult = await updateConfig.execute(config);
      
      if (updateResult.ok) {
        const response: MessageResponse = {
          type: VSCODE_TYPES.CONFIG.UPDATE_RESPONSE,
          status: RESPONSE_STATUS.SUCCESS,
          payload: { 
            config: updateResult.value 
          },
          id: message.id || 'unknown'
        };
        
        console.log('ConfigHandler: Config update successful');
        return response;
      } else {
        const response: MessageResponse = {
          type: VSCODE_TYPES.CONFIG.UPDATE_RESPONSE,
          status: RESPONSE_STATUS.ERROR,
          payload: { 
            error: updateResult.error.message || 'Failed to update configuration'
          },
          id: message.id || 'unknown'
        };
        
        console.error('ConfigHandler: Config update failed:', updateResult.error);
        return response;
      }
    } catch (error) {
      console.error('ConfigHandler: Config update error:', error);
      
      const response: MessageResponse = {
        type: VSCODE_TYPES.CONFIG.UPDATE_RESPONSE,
        status: RESPONSE_STATUS.ERROR,
        payload: { 
          error: error instanceof Error ? error.message : 'Unknown error occurred while updating configuration'
        },
        id: message.id || 'unknown'
      };
      
      return response;
    }
  }
}