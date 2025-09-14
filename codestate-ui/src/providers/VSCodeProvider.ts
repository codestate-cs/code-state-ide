import type { DataProvider, VSCodeMessage, ThemeCallback } from './DataProvider';
import { SessionManager } from '../managers/SessionManager';
import { ScriptManager } from '../managers/ScriptManager';
import { TerminalCollectionManager } from '../managers/TerminalCollectionManager';
import { DataManager } from '../managers/DataManager';
import { ThemeManager } from '../managers/ThemeManager';
import { ConfigManager } from '../managers/ConfigManager';

// VS Code Provider for production builds
export class VSCodeProvider implements DataProvider {
  private vscode: any;
  private connected: boolean = false;
  
  // Manager classes
  public sessionManager: SessionManager;
  public scriptManager: ScriptManager;
  public terminalCollectionManager: TerminalCollectionManager;
  public dataManager: DataManager;
  public themeManager: ThemeManager;
  public configManager: ConfigManager;

  constructor() {
    this.vscode = this.acquireVSCodeApi();
    this.sessionManager = new SessionManager();
    this.scriptManager = new ScriptManager();
    this.terminalCollectionManager = new TerminalCollectionManager();
    this.dataManager = new DataManager();
    this.themeManager = new ThemeManager();
    this.configManager = new ConfigManager();
    this.setupMessageListener();
  }

  private acquireVSCodeApi(): any {
    // Check if we're in VS Code webview context
    if (typeof window !== 'undefined' && (window as any).acquireVsCodeApi) {
      return (window as any).acquireVsCodeApi();
    }
    throw new Error('VSCodeProvider can only be used in VS Code webview context');
  }

  private setupMessageListener(): void {
    window.addEventListener('message', (event) => {
      console.log('VSCodeProvider: Raw message event received', event.data);
      const message: VSCodeMessage = event.data;
      this.handleMessage(message);
    });
  }

  private handleMessage(message: VSCodeMessage): void {
    console.log('VSCodeProvider: Received message', message);
    switch (message.type) {
      case 'theme-changed':
        this.themeManager.handleThemeChange(message.payload.theme);
        break;
      case 'codestate.sessions.init.response':
        this.dataManager.handleSessionsInitResponse(message.payload);
        break;
      case 'codestate.scripts.init.response':
        this.dataManager.handleScriptsInitResponse(message.payload);
        break;
      case 'codestate.tc.init.response':
        this.dataManager.handleTerminalCollectionsInitResponse(message.payload);
        break;
      case 'codestate.sessions.create.init.response':
        this.sessionManager.handleSessionCreateInitResponse(message.payload);
        break;
      case 'codestate.session.create.response':
        this.sessionManager.handleSessionCreateResponse(message);
        break;
      case 'codestate.script.create.response':
        this.scriptManager.handleScriptCreateResponse(message);
        break;
      case 'codestate.script.delete.response':
        this.scriptManager.handleScriptDeleteResponse(message);
        break;
      case 'codestate.script.update.response':
        this.scriptManager.handleScriptUpdateResponse(message);
        break;
      case 'codestate.terminal-collection.create.response':
        this.terminalCollectionManager.handleTerminalCollectionCreateResponse(message);
        break;
      case 'codestate.terminal-collection.delete.response':
        this.terminalCollectionManager.handleTerminalCollectionDeleteResponse(message);
        break;
      case 'codestate.terminal-collection.update.response':
        this.terminalCollectionManager.handleTerminalCollectionUpdateResponse(message);
        break;
      case 'codestate.terminal-collection.resume.response':
        this.terminalCollectionManager.handleTerminalCollectionResumeResponse(message);
        break;
      case 'codestate.session.resume.response':
        this.sessionManager.handleSessionResumeResponse(message);
        break;
      case 'codestate.session.delete.response':
        this.sessionManager.handleSessionDeleteResponse(message);
        break;
      case 'codestate.session.update.response':
        this.sessionManager.handleSessionUpdateResponse(message);
        break;
      case 'codestate.session.export.response':
        this.sessionManager.handleSessionExportResponse(message);
        break;
      case 'codestate.config.init.response':
        console.log('VSCodeProvider: Received config init response', message);
        this.configManager.handleConfigInitResponse(message);
        break;
      case 'codestate.config.update.response':
        console.log('VSCodeProvider: Received config update response', message);
        this.configManager.handleConfigUpdateResponse(message);
        break;
    }
  }

  async initialize(): Promise<void> {
    this.connected = true;
    // Send handshake message to VS Code extension
    this.sendMessage('codestate.ui.ready', {});
  }

  destroy(): void {
    this.connected = false;
  }

  // Data initialization methods - just send messages, managers handle responses
  initializeSessions(): void {
    this.sendMessage('codestate.sessions.init', {});
  }

  initializeScripts(): void {
    this.sendMessage('codestate.scripts.init', {});
  }

  initializeTerminalCollections(): void {
    this.sendMessage('codestate.tc.init', {});
  }

  initializeConfig(): void {
    this.sendMessage('codestate.config.init', {});
  }

  sendMessage(type: string, payload: any): void {
    if (this.vscode) {
      // Generate a unique message ID for tracking
      const messageId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      this.vscode.postMessage({ type, payload, id: messageId });
    }
  }

  getTheme(): string {
    return this.themeManager.getCurrentTheme();
  }

  setTheme(theme: string): void {
    // Update local theme immediately for instant UI feedback
    this.themeManager.handleThemeChange(theme);
    
    // Send message to VS Code extension for persistence
    this.sendMessage('set-theme', { theme });
  }

  onThemeChange(callback: ThemeCallback): void {
    // Listen for theme change events from the manager
    window.addEventListener('theme-changed', (event: any) => {
      callback(event.detail.theme);
    });
  }

  isConnected(): boolean {
    return this.connected;
  }

  initializeSessionCreation(): void {
    // Send session creation init message - response will be handled by manager
    this.sendMessage('codestate.sessions.create.init', {});
  }
}