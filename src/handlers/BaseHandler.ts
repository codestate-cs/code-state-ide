import * as vscode from 'vscode';
import { MessageRequest } from '../types';

export interface BaseHandler {
  handleMessage(message: MessageRequest, webview: vscode.Webview): Promise<void>;
  canHandle(messageType: string): boolean;
}