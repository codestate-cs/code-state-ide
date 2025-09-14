import type { DataProvider, Theme, MessageCallback, ThemeCallback } from './DataProvider';

// Mock Provider for development builds
export class MockProvider implements DataProvider {
  private messageCallbacks: Set<MessageCallback> = new Set();
  private themeCallbacks: Set<ThemeCallback> = new Set();
  private currentTheme: Theme = 'dark';
  private connected: boolean = false;
  private mockData: any = null;

  // Manager implementations
  sessionManager = {
    initializeSessions: () => this.initializeSessions(),
    handleSessionsInitResponse: (data: any) => console.log('Mock: Sessions init response', data),
    handleSessionCreateResponse: (data: any) => console.log('Mock: Session create response', data),
    handleSessionDeleteResponse: (data: any) => console.log('Mock: Session delete response', data),
    handleSessionUpdateResponse: (data: any) => console.log('Mock: Session update response', data),
    handleSessionResumeResponse: (data: any) => console.log('Mock: Session resume response', data),
    handleSessionExportResponse: (data: any) => console.log('Mock: Session export response', data),
    handleSessionCreateInitResponse: (data: any) => console.log('Mock: Session create init response', data)
  };

  dataManager = {
    initializeSessions: () => this.initializeSessions(),
    initializeScripts: () => this.initializeScripts(),
    initializeTerminalCollections: () => this.initializeTerminalCollections(),
    handleSessionsInitResponse: (data: any) => console.log('Mock: Sessions init response', data),
    handleScriptsInitResponse: (data: any) => console.log('Mock: Scripts init response', data),
    handleTerminalCollectionsInitResponse: (data: any) => console.log('Mock: Terminal collections init response', data)
  };

  terminalCollectionManager = {
    handleTerminalCollectionsInitResponse: (data: any) => console.log('Mock: Terminal collections init response', data),
    handleTerminalCollectionCreateResponse: (data: any) => console.log('Mock: Terminal collection create response', data),
    handleTerminalCollectionDeleteResponse: (data: any) => console.log('Mock: Terminal collection delete response', data),
    handleTerminalCollectionUpdateResponse: (data: any) => console.log('Mock: Terminal collection update response', data),
    handleTerminalCollectionResumeResponse: (data: any) => console.log('Mock: Terminal collection resume response', data)
  };

  themeManager = {
    handleThemeChange: (theme: string) => this.setTheme(theme),
    getCurrentTheme: () => this.getTheme()
  };

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData(): void {
    // Rich mock data for development based on @codestate/core types
    this.mockData = {
      sessions: [
        {
          id: 'session-1',
          name: 'React Development',
          projectRoot: '/Users/dev/projects/react-app',
          createdAt: new Date('2024-01-15T10:30:00Z'),
          updatedAt: new Date('2024-01-20T14:45:00Z'),
          tags: ['react', 'frontend', 'development'],
          notes: 'Working on the new dashboard component with React hooks',
          files: [
            {
              path: '/Users/dev/projects/react-app/src/App.tsx',
              cursor: { line: 25, column: 12 },
              scroll: { top: 100, left: 0 },
              isActive: true,
              position: 0
            },
            {
              path: '/Users/dev/projects/react-app/src/components/Dashboard.tsx',
              cursor: { line: 45, column: 8 },
              scroll: { top: 200, left: 0 },
              isActive: false,
              position: 1
            },
            {
              path: '/Users/dev/projects/react-app/src/hooks/useAuth.ts',
              cursor: { line: 12, column: 4 },
              scroll: { top: 50, left: 0 },
              isActive: false,
              position: 2
            }
          ],
          git: {
            branch: 'feature/dashboard',
            commit: 'a1b2c3d4e5f6',
            isDirty: true,
            stashId: null
          },
          extensions: {
            'vscode.typescript': { version: '5.0.0' },
            'vscode.react': { version: '2.0.0' }
          },
          terminalCommands: [
            {
              terminalId: 1,
              terminalName: 'main',
              commands: [
                { command: 'npm start', name: 'Start Dev Server', priority: 1 },
                { command: 'npm test', name: 'Run Tests', priority: 2 }
              ]
            }
          ],
          terminalCollections: ['tc-1'],
          scripts: ['script-1', 'script-2']
        },
        {
          id: 'session-2',
          name: 'API Integration',
          projectRoot: '/Users/dev/projects/api-service',
          createdAt: new Date('2024-01-10T09:15:00Z'),
          updatedAt: new Date('2024-01-18T16:20:00Z'),
          tags: ['api', 'backend', 'nodejs'],
          notes: 'Integrating with third-party payment service',
          files: [
            {
              path: '/Users/dev/projects/api-service/src/routes/payment.ts',
              cursor: { line: 78, column: 15 },
              scroll: { top: 300, left: 0 },
              isActive: true,
              position: 0
            },
            {
              path: '/Users/dev/projects/api-service/src/services/stripe.ts',
              cursor: { line: 23, column: 6 },
              scroll: { top: 150, left: 0 },
              isActive: false,
              position: 1
            }
          ],
          git: {
            branch: 'main',
            commit: 'f6e5d4c3b2a1',
            isDirty: false,
            stashId: 'stash-123'
          },
          extensions: {
            'vscode.node': { version: '1.0.0' },
            'vscode.rest': { version: '1.5.0' }
          },
          terminalCommands: [
            {
              terminalId: 2,
              terminalName: 'api',
              commands: [
                { command: 'npm run dev', name: 'Start API Server', priority: 1 },
                { command: 'npm run test:integration', name: 'Integration Tests', priority: 2 }
              ]
            }
          ],
          terminalCollections: ['tc-2'],
          scripts: ['script-3']
        },
        {
          id: 'session-3',
          name: 'Mobile App',
          projectRoot: '/Users/dev/projects/mobile-app',
          createdAt: new Date('2024-01-05T14:00:00Z'),
          updatedAt: new Date('2024-01-12T11:30:00Z'),
          tags: ['mobile', 'react-native', 'ios'],
          files: [
            {
              path: '/Users/dev/projects/mobile-app/src/screens/HomeScreen.tsx',
              cursor: { line: 15, column: 20 },
              scroll: { top: 0, left: 0 },
              isActive: true,
              position: 0
            }
          ],
          git: {
            branch: 'develop',
            commit: 'b2c3d4e5f6a1',
            isDirty: false,
            stashId: null
          },
          extensions: {
            'vscode.react-native': { version: '1.2.0' }
          },
          terminalCommands: [],
          terminalCollections: [],
          scripts: ['script-4']
        }
      ],
      scripts: [
        {
          id: 'script-1',
          name: 'Start Development',
          rootPath: '/Users/dev/projects/react-app',
          script: 'npm start',
          commands: [
            { command: 'npm install', name: 'Install Dependencies', priority: 1 },
            { command: 'npm start', name: 'Start Dev Server', priority: 2 }
          ],
          lifecycle: ['open'],
          executionMode: 'same-terminal',
          closeTerminalAfterExecution: false
        },
        {
          id: 'script-2',
          name: 'Run Tests',
          rootPath: '/Users/dev/projects/react-app',
          script: 'npm test',
          commands: [
            { command: 'npm test', name: 'Run Tests', priority: 1 }
          ],
          lifecycle: ['resume'],
          executionMode: 'new-terminals',
          closeTerminalAfterExecution: true
        }
      ],
      terminalCollections: [
        {
          id: 'tc-1',
          name: 'React Development Terminals',
          rootPath: '/Users/dev/projects/react-app',
          lifecycle: ['open', 'resume'],
          scripts: [
            {
              id: 'script-1',
              name: 'Start Development',
              rootPath: '/Users/dev/projects/react-app',
              script: 'npm start',
              commands: [
                { command: 'npm install', name: 'Install Dependencies', priority: 1 },
                { command: 'npm start', name: 'Start Dev Server', priority: 2 }
              ],
              lifecycle: ['open'],
              executionMode: 'same-terminal',
              closeTerminalAfterExecution: false
            }
          ],
          closeTerminalAfterExecution: false
        }
      ]
    };
  }

  async initialize(): Promise<void> {
    this.connected = true;
    
    // Simulate handshake with VS Code extension
    console.log('Mock: Sending codestate.ui.ready handshake');
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('Mock: Handshake acknowledged by VS Code extension');
  }

  destroy(): void {
    this.messageCallbacks.clear();
    this.themeCallbacks.clear();
    this.connected = false;
  }

  async getData(): Promise<any> {
    return new Promise((resolve) => {
      // Simulate sending codestate.sessions.init message
      console.log('Mock: Sending codestate.sessions.init request');
      
      // Simulate VS Code response with codestate.sessions.init.response
      setTimeout(() => {
        console.log('Mock: Received codestate.sessions.init.response');
        resolve(this.mockData);
      }, 300);
    });
  }

  async getSessions(): Promise<any> {
    return new Promise((resolve) => {
      console.log('Mock: Sending codestate.sessions.init request');
      setTimeout(() => {
        console.log('Mock: Received codestate.sessions.init.response');
        resolve({ sessions: this.mockData.sessions });
      }, 300);
    });
  }

  async getScripts(): Promise<any> {
    return new Promise((resolve) => {
      console.log('Mock: Sending codestate.scripts.init request');
      setTimeout(() => {
        console.log('Mock: Received codestate.scripts.init.response');
        resolve({ scripts: this.mockData.scripts });
      }, 300);
    });
  }

  async getTerminalCollections(): Promise<any> {
    return new Promise((resolve) => {
      console.log('Mock: Sending codestate.tc.init request');
      setTimeout(() => {
        console.log('Mock: Received codestate.tc.init.response');
        resolve({ terminalCollections: this.mockData.terminalCollections });
      }, 300);
    });
  }

  // New interface methods (no returns expected)
  initializeSessions(): void {
    console.log('Mock: Initializing sessions');
    this.sendMessage('codestate.sessions.init', {});
  }

  initializeScripts(): void {
    console.log('Mock: Initializing scripts');
    this.sendMessage('codestate.scripts.init', {});
  }

  initializeTerminalCollections(): void {
    console.log('Mock: Initializing terminal collections');
    this.sendMessage('codestate.tc.init', {});
  }

  // Session event handlers (no returns expected)
  setSessionCreateHandler(handler: (data: any) => void): void {
    // Store handler for session create events
    this.messageCallbacks.add((data) => {
      if (data.type === 'codestate.session.create.response') {
        handler(data);
      }
    });
  }

  setSessionDeleteHandler(handler: (data: any) => void): void {
    // Store handler for session delete events
    this.messageCallbacks.add((data) => {
      if (data.type === 'codestate.session.delete.response') {
        handler(data);
      }
    });
  }

  setSessionUpdateHandler(handler: (data: any) => void): void {
    // Store handler for session update events
    this.messageCallbacks.add((data) => {
      if (data.type === 'codestate.session.update.response') {
        handler(data);
      }
    });
  }

  setSessionResumeHandler(handler: (data: any) => void): void {
    // Store handler for session resume events
    this.messageCallbacks.add((data) => {
      if (data.type === 'codestate.session.resume.response') {
        handler(data);
      }
    });
  }

  setSessionExportHandler(handler: (data: any) => void): void {
    // Store handler for session export events
    this.messageCallbacks.add((data) => {
      if (data.type === 'codestate.session.export.response') {
        handler(data);
      }
    });
  }

  // Data handler access
  get dataHandler() {
    return {
      setSessionsInitHandler: (handler: (data: any) => void) => {
        this.messageCallbacks.add((data) => {
          if (data.type === 'codestate.sessions.init.response') {
            handler(data);
          }
        });
      },
      setScriptsInitHandler: (handler: (data: any) => void) => {
        this.messageCallbacks.add((data) => {
          if (data.type === 'codestate.scripts.init.response') {
            handler(data);
          }
        });
      },
      setTerminalCollectionsInitHandler: (handler: (data: any) => void) => {
        this.messageCallbacks.add((data) => {
          if (data.type === 'codestate.tc.init.response') {
            handler(data);
          }
        });
      },
      setSessionCreateInitHandler: (handler: (data: any) => void) => {
        this.messageCallbacks.add((data) => {
          if (data.type === 'codestate.sessions.create.init.response') {
            handler(data);
          }
        });
      }
    };
  }

  sendMessage(type: string, payload: any): void {
    console.log(`[MockProvider] Message sent:`, { type, payload });
    
    // Simulate VS Code responses
    setTimeout(() => {
      switch (type) {
        case 'codestate.ui.ready':
          console.log('Mock: VS Code extension acknowledges UI ready');
          break;
        case 'codestate.sessions.init':
          console.log('Mock: VS Code extension processing sessions init request');
          // Simulate response
          setTimeout(() => {
            this.messageCallbacks.forEach(callback => callback({ sessions: this.mockData.sessions }));
          }, 200);
          break;
        case 'codestate.scripts.init':
          console.log('Mock: VS Code extension processing scripts init request');
          // Simulate response
          setTimeout(() => {
            this.messageCallbacks.forEach(callback => callback({ scripts: this.mockData.scripts }));
          }, 200);
          break;
        case 'codestate.tc.init':
          console.log('Mock: VS Code extension processing terminal collections init request');
          // Simulate response
          setTimeout(() => {
            this.messageCallbacks.forEach(callback => callback({ terminalCollections: this.mockData.terminalCollections }));
          }, 200);
          break;
        case 'codestate.sessions.create.init':
          console.log('Mock: VS Code extension processing session creation init request');
          // Simulate response with session data
          setTimeout(() => {
            const sessionData = {
              name: '',
              projectRoot: '/Users/dev/projects/react-app',
              createdAt: new Date(),
              updatedAt: new Date(),
              tags: [],
              notes: '',
              files: [
                {
                  path: 'src/App.tsx',
                  cursor: { line: 15, column: 8 },
                  scroll: { top: 0, left: 0 },
                  isActive: true,
                  position: 0
                },
                {
                  path: 'src/components/Header.tsx',
                  cursor: { line: 1, column: 1 },
                  scroll: { top: 0, left: 0 },
                  isActive: false,
                  position: 1
                }
              ],
              git: {
                branch: 'main',
                commit: 'abc123def456',
                isDirty: false,
                stashId: null
              },
              extensions: {
                vscode: {
                  theme: 'dark',
                  language: 'typescript',
                  extensions: ['ms-vscode.vscode-typescript-next']
                }
              },
              terminalCommands: [],
              terminalCollections: [],
              scripts: []
            };
            this.messageCallbacks.forEach(callback => callback({ 
              type: 'codestate.sessions.create.init.response',
              payload: { sessionData }
            }));
          }, 200);
          break;
        case 'codestate.session.create':
          console.log('Mock: VS Code extension processing session creation request');
          // Simulate response with session ID
          setTimeout(() => {
            const sessionId = `session-${Date.now()}`;
            this.messageCallbacks.forEach(callback => callback({ 
              type: 'codestate.session.create.response',
              payload: { 
                success: true, 
                id: sessionId,
                message: 'Session created successfully' 
              }
            }));
          }, 200);
          break;
        case 'codestate.script.create':
          console.log('Mock: VS Code extension processing script creation request');
          // Simulate response with script ID
          setTimeout(() => {
            const scriptId = `script-${Date.now()}`;
            this.messageCallbacks.forEach(callback => callback({ 
              type: 'codestate.script.create.response',
              payload: { 
                success: true, 
                id: scriptId,
                message: 'Script created successfully' 
              }
            }));
          }, 200);
          break;
        case 'codestate.terminal-collection.create':
          console.log('Mock: VS Code extension processing terminal collection creation request');
          // Simulate response with terminal collection ID
          setTimeout(() => {
            const terminalCollectionId = `terminal-collection-${Date.now()}`;
            this.messageCallbacks.forEach(callback => callback({ 
              type: 'codestate.terminal-collection.create.response',
              payload: { 
                success: true, 
                id: terminalCollectionId,
                message: 'Terminal collection created successfully' 
              }
            }));
          }, 200);
          break;
        case 'codestate.terminal-collection.delete':
          console.log('Mock: VS Code extension processing terminal collection deletion request');
          // Simulate response
          setTimeout(() => {
            this.messageCallbacks.forEach(callback => callback({ 
              type: 'codestate.terminal-collection.delete.response',
              payload: { 
                success: true, 
                id: payload.id,
                message: 'Terminal collection deleted successfully' 
              }
            }));
          }, 200);
          break;
        case 'codestate.terminal-collection.update':
          console.log('Mock: VS Code extension processing terminal collection update request');
          // Simulate response
          setTimeout(() => {
            this.messageCallbacks.forEach(callback => callback({ 
              type: 'codestate.terminal-collection.update.response',
              payload: { 
                success: true, 
                id: payload.id,
                message: 'Terminal collection updated successfully' 
              }
            }));
          }, 200);
          break;
        case 'codestate.terminal-collection.resume':
          console.log('Mock: VS Code extension processing terminal collection resume request');
          // Simulate response
          setTimeout(() => {
            this.messageCallbacks.forEach(callback => callback({ 
              type: 'codestate.terminal-collection.resume.response',
              payload: { 
                success: true, 
                id: payload.id,
                message: 'Terminal collection resumed successfully' 
              }
            }));
          }, 200);
          break;
        case 'set-theme':
          this.currentTheme = payload.theme;
          this.themeCallbacks.forEach(callback => callback(this.currentTheme));
          break;
        case 'get-data':
          this.messageCallbacks.forEach(callback => callback(this.mockData));
          break;
      }
    }, 100);
  }

  onMessage(callback: MessageCallback): void {
    this.messageCallbacks.add(callback);
  }

  offMessage(callback: MessageCallback): void {
    this.messageCallbacks.delete(callback);
  }

  getTheme(): string {
    return this.currentTheme;
  }

  setTheme(theme: string): void {
    this.currentTheme = theme as Theme;
    console.log(`[MockProvider] Theme changed to:`, theme);
  }

  onThemeChange(callback: ThemeCallback): void {
    this.themeCallbacks.add(callback);
  }

  isConnected(): boolean {
    return this.connected;
  }

  initializeSessionCreation(): void {
    // Send session creation init message - response will be handled by manager
    this.sendMessage('codestate.sessions.create.init', {});
  }

  // Development-only methods
  updateMockData(newData: any): void {
    this.mockData = { ...this.mockData, ...newData };
    this.messageCallbacks.forEach(callback => callback(this.mockData));
  }

  simulateError(error: string): void {
    console.error(`[MockProvider] Simulated error:`, error);
  }
}