// Base interface for all data providers
// Data provider interface for VS Code integration

export interface DataProvider {
  // Data initialization (no returns expected)
  initializeSessions(): void;
  initializeScripts(): void;
  initializeTerminalCollections(): void;
  initializeConfig(): void;
  
  // Message communication
  sendMessage(type: string, payload: any): void;
  
  // Direct manager access
  sessionManager: {
    initializeSessions(): void;
    handleSessionsInitResponse(data: any): void;
    handleSessionCreateResponse(data: any): void;
    handleSessionDeleteResponse(data: any): void;
    handleSessionUpdateResponse(data: any): void;
    handleSessionResumeResponse(data: any): void;
    handleSessionExportResponse(data: any): void;
    handleSessionCreateInitResponse(data: any): void;
  };
  
  dataManager: {
    initializeSessions(): void;
    initializeScripts(): void;
    initializeTerminalCollections(): void;
    handleSessionsInitResponse(data: any): void;
    handleScriptsInitResponse(data: any): void;
    handleTerminalCollectionsInitResponse(data: any): void;
  };
  
  terminalCollectionManager: {
    handleTerminalCollectionsInitResponse(data: any): void;
    handleTerminalCollectionCreateResponse(data: any): void;
    handleTerminalCollectionDeleteResponse(data: any): void;
    handleTerminalCollectionUpdateResponse(data: any): void;
    handleTerminalCollectionResumeResponse(data: any): void;
  };
  
  themeManager: {
    handleThemeChange(theme: string): void;
    getCurrentTheme(): string;
  };
  
  configManager: {
    handleConfigInitResponse(data: any): void;
    handleConfigUpdateResponse(data: any): void;
  };
  
  // Theme management
  getTheme(): string;
  setTheme(theme: string): void;
  onThemeChange(callback: (theme: string) => void): void;
  
  // Lifecycle
  initialize(): Promise<void>;
  destroy(): void;
  
  // Status
  isConnected(): boolean;
  
  // Session creation (no returns expected)
  initializeSessionCreation(): void;
}

// Message types for VS Code communication
export interface VSCodeMessage {
  type: string;
  payload: any;
  status?: string;
  id?: string;
}

// Theme types
export type Theme = 'match-ide' | 'light' | 'dark';

// Data structure for UI state
export interface UIState {
  theme: Theme;
  data: any;
  isLoading: boolean;
  error?: string;
}

// Event callback types
export type MessageCallback = (data: any) => void;
export type ThemeCallback = (theme: Theme) => void;