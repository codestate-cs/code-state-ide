# CodeState VS Code Extension Implementation Roadmap

## Quick Start Guide

This roadmap provides a step-by-step approach to implementing the CodeState VS Code extension, starting with the foundation and building up to the complete feature set.

## Phase 1: Foundation Setup (Week 1)

### Step 1: Project Structure Setup
```bash
# Create the directory structure
mkdir -p src/{presentation/{commands,statusbar,webviews,views},application/{usecases,controllers,presenters},domain/{entities,interfaces,services},infrastructure/{adapters,repositories,storage},shared/{constants,types,utils,errors},test/{unit,integration,e2e}}

# Create initial files
touch src/shared/constants/Commands.ts
touch src/shared/constants/Views.ts
touch src/shared/constants/Messages.ts
touch src/shared/types/VSCodeTypes.ts
touch src/shared/types/ExtensionTypes.ts
touch src/shared/errors/ExtensionError.ts
touch src/shared/errors/ErrorHandler.ts
```

### Step 2: Core Types and Interfaces
Create the foundational types that extend the CodeState Core types:

```typescript
// src/shared/types/VSCodeTypes.ts
import { Session, FileState, GitState } from 'codestate-core';

export interface VSCodeSession extends Session {
  vscodeState: VSCodeState;
  metadata: SessionMetadata;
}

export interface VSCodeState {
  openFiles: VSCodeFileState[];
  activeEditor?: string;
  terminalSessions: TerminalSession[];
  workspaceFolders: string[];
  windowState: WindowState;
  gitState: GitState;
}

export interface VSCodeFileState extends FileState {
  viewColumn?: number;
  isVisible: boolean;
  isPinned: boolean;
  preview: boolean;
  languageId?: string;
  selections?: Selection[];
}

export interface TerminalSession {
  id: string;
  name: string;
  shellPath: string;
  shellArgs: string[];
  cwd: string;
  env: Record<string, string>;
  commands: string[];
  isActive: boolean;
}

export interface WindowState {
  activeViewColumn?: number;
  panelPosition?: string;
  sidebarPosition?: string;
}

export interface SessionMetadata {
  vscodeVersion: string;
  extensionVersion: string;
  captureTimestamp: Date;
  restoreCount: number;
  lastRestored?: Date;
}
```

### Step 3: Error Handling Foundation
```typescript
// src/shared/errors/ExtensionError.ts
export enum ExtensionErrorCode {
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  SESSION_ALREADY_EXISTS = 'SESSION_ALREADY_EXISTS',
  INVALID_SESSION_DATA = 'INVALID_SESSION_DATA',
  WORKSPACE_NOT_FOUND = 'WORKSPACE_NOT_FOUND',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  TERMINAL_CREATION_FAILED = 'TERMINAL_CREATION_FAILED',
  GIT_OPERATION_FAILED = 'GIT_OPERATION_FAILED',
  VSCODE_API_ERROR = 'VSCODE_API_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

export class ExtensionError extends Error {
  constructor(
    message: string,
    public code: ExtensionErrorCode,
    public originalError?: Error,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ExtensionError';
  }

  get userMessage(): string {
    return this.getUserFriendlyMessage();
  }

  private getUserFriendlyMessage(): string {
    switch (this.code) {
      case ExtensionErrorCode.SESSION_NOT_FOUND:
        return 'Session not found. Please check the session name and try again.';
      case ExtensionErrorCode.WORKSPACE_NOT_FOUND:
        return 'Workspace not found. Please ensure the project is open in VS Code.';
      case ExtensionErrorCode.FILE_NOT_FOUND:
        return 'Some files from the session could not be found.';
      default:
        return this.message;
    }
  }
}
```

### Step 4: Constants and Messages
```typescript
// src/shared/constants/Commands.ts
export const Commands = {
  SAVE_SESSION: 'codestate.saveSession',
  RESUME_SESSION: 'codestate.resumeSession',
  LIST_SESSIONS: 'codestate.listSessions',
  DELETE_SESSION: 'codestate.deleteSession',
  EXPORT_SESSION: 'codestate.exportSession'
} as const;

// src/shared/constants/Views.ts
export const Views = {
  SESSIONS_TREE: 'codestateSessions'
} as const;

// src/shared/constants/Messages.ts
export const Messages = {
  SESSION_SAVED: 'Session "{name}" saved successfully',
  SESSION_RESUMED: 'Session "{name}" resumed successfully',
  SESSION_DELETED: 'Session "{name}" deleted successfully',
  SESSION_NOT_FOUND: 'Session "{name}" not found',
  WORKSPACE_REQUIRED: 'Please open a workspace to use CodeState',
  SAVE_PROMPT: 'Enter session name:',
  RESUME_PROMPT: 'Select session to resume:'
} as const;
```

## Phase 2: Infrastructure Layer (Week 2)

### Step 1: CodeState Core Adapter
```typescript
// src/infrastructure/adapters/CodeStateCoreAdapter.ts
import { 
  Session, 
  SaveSession, 
  ResumeSession, 
  ListSessions, 
  DeleteSession,
  ExportSession,
  ImportSession,
  success,
  failure,
  Result
} from 'codestate-core';
import { VSCodeSession, ExtensionError, ExtensionErrorCode } from '@/shared/types/VSCodeTypes';
import { ExtensionError as ExtError } from '@/shared/errors/ExtensionError';

export class CodeStateCoreAdapter {
  private saveSessionUseCase: SaveSession;
  private resumeSessionUseCase: ResumeSession;
  private listSessionsUseCase: ListSessions;
  private deleteSessionUseCase: DeleteSession;
  private exportSessionUseCase: ExportSession;
  private importSessionUseCase: ImportSession;

  constructor() {
    this.saveSessionUseCase = new SaveSession();
    this.resumeSessionUseCase = new ResumeSession();
    this.listSessionsUseCase = new ListSessions();
    this.deleteSessionUseCase = new DeleteSession();
    this.exportSessionUseCase = new ExportSession();
    this.importSessionUseCase = new ImportSession();
  }

  async saveSession(session: VSCodeSession): Promise<Result<void, ExtensionError>> {
    try {
      const coreSession = this.convertToCoreSession(session);
      const result = await this.saveSessionUseCase.execute(coreSession);
      
      if (result.ok) {
        return success(undefined);
      } else {
        return failure(new ExtError(
          'Failed to save session',
          ExtensionErrorCode.STORAGE_ERROR,
          result.error
        ));
      }
    } catch (error) {
      return failure(new ExtError(
        'Unexpected error saving session',
        ExtensionErrorCode.STORAGE_ERROR,
        error instanceof Error ? error : undefined
      ));
    }
  }

  async loadSession(sessionId: string): Promise<Result<VSCodeSession, ExtensionError>> {
    try {
      const result = await this.resumeSessionUseCase.execute(sessionId);
      
      if (result.ok) {
        const vscodeSession = this.convertToVSCodeSession(result.value);
        return success(vscodeSession);
      } else {
        return failure(new ExtError(
          'Failed to load session',
          ExtensionErrorCode.SESSION_NOT_FOUND,
          result.error
        ));
      }
    } catch (error) {
      return failure(new ExtError(
        'Unexpected error loading session',
        ExtensionErrorCode.SESSION_NOT_FOUND,
        error instanceof Error ? error : undefined
      ));
    }
  }

  async listSessions(filter?: SessionFilter): Promise<Result<VSCodeSession[], ExtensionError>> {
    try {
      const result = await this.listSessionsUseCase.execute(filter);
      
      if (result.ok) {
        const vscodeSessions = result.value.map(session => this.convertToVSCodeSession(session));
        return success(vscodeSessions);
      } else {
        return failure(new ExtError(
          'Failed to list sessions',
          ExtensionErrorCode.STORAGE_ERROR,
          result.error
        ));
      }
    } catch (error) {
      return failure(new ExtError(
        'Unexpected error listing sessions',
        ExtensionErrorCode.STORAGE_ERROR,
        error instanceof Error ? error : undefined
      ));
    }
  }

  private convertToCoreSession(vscodeSession: VSCodeSession): Session {
    const { vscodeState, metadata, ...coreSession } = vscodeSession;
    return coreSession;
  }

  private convertToVSCodeSession(coreSession: Session): VSCodeSession {
    return {
      ...coreSession,
      vscodeState: {
        openFiles: [],
        terminalSessions: [],
        workspaceFolders: [],
        windowState: {},
        gitState: coreSession.git
      },
      metadata: {
        vscodeVersion: 'unknown',
        extensionVersion: '0.0.1',
        captureTimestamp: new Date(),
        restoreCount: 0
      }
    };
  }
}
```

### Step 2: VS Code API Adapter
```typescript
// src/infrastructure/adapters/VSCodeAPIAdapter.ts
import * as vscode from 'vscode';
import { VSCodeFileState, TerminalSession, WindowState } from '@/shared/types/VSCodeTypes';
import { ExtensionError, ExtensionErrorCode } from '@/shared/errors/ExtensionError';
import { Result, success, failure } from 'codestate-core';

export class VSCodeAPIAdapter {
  async captureFileStates(): Promise<Result<VSCodeFileState[], ExtensionError>> {
    try {
      const visibleEditors = vscode.window.visibleTextEditors;
      const fileStates: VSCodeFileState[] = [];

      for (const editor of visibleEditors) {
        const fileState: VSCodeFileState = {
          path: editor.document.uri.fsPath,
          cursor: {
            line: editor.selection.active.line,
            column: editor.selection.active.character
          },
          scroll: {
            top: editor.visibleRanges[0]?.start.line || 0,
            left: 0
          },
          isActive: editor === vscode.window.activeTextEditor,
          viewColumn: editor.viewColumn,
          isVisible: true,
          isPinned: false,
          preview: editor.document.isUntitled,
          languageId: editor.document.languageId,
          selections: editor.selections.map(selection => ({
            anchor: { line: selection.anchor.line, character: selection.anchor.character },
            active: { line: selection.active.line, character: selection.active.character },
            start: { line: selection.start.line, character: selection.start.character },
            end: { line: selection.end.line, character: selection.end.character },
            isEmpty: selection.isEmpty,
            isReversed: selection.isReversed
          }))
        };
        fileStates.push(fileState);
      }

      return success(fileStates);
    } catch (error) {
      return failure(new ExtensionError(
        'Failed to capture file states',
        ExtensionErrorCode.VSCODE_API_ERROR,
        error instanceof Error ? error : undefined
      ));
    }
  }

  async restoreFileStates(states: VSCodeFileState[]): Promise<Result<void, ExtensionError>> {
    try {
      for (const state of states) {
        await this.openFile(state);
      }
      return success(undefined);
    } catch (error) {
      return failure(new ExtensionError(
        'Failed to restore file states',
        ExtensionErrorCode.VSCODE_API_ERROR,
        error instanceof Error ? error : undefined
      ));
    }
  }

  async captureTerminalSessions(): Promise<Result<TerminalSession[], ExtensionError>> {
    try {
      const terminals = vscode.window.terminals;
      const sessions: TerminalSession[] = [];

      for (const terminal of terminals) {
        const session: TerminalSession = {
          id: terminal.name || `terminal-${Date.now()}`,
          name: terminal.name || 'Terminal',
          shellPath: '',
          shellArgs: [],
          cwd: '',
          env: {},
          commands: [],
          isActive: terminal === vscode.window.activeTerminal
        };
        sessions.push(session);
      }

      return success(sessions);
    } catch (error) {
      return failure(new ExtensionError(
        'Failed to capture terminal sessions',
        ExtensionErrorCode.TERMINAL_CREATION_FAILED,
        error instanceof Error ? error : undefined
      ));
    }
  }

  async captureWindowState(): Promise<WindowState> {
    return {
      activeViewColumn: vscode.window.activeTextEditor?.viewColumn,
      panelPosition: 'bottom',
      sidebarPosition: 'left'
    };
  }

  private async openFile(fileState: VSCodeFileState): Promise<void> {
    const uri = vscode.Uri.file(fileState.path);
    const document = await vscode.workspace.openTextDocument(uri);
    const editor = await vscode.window.showTextDocument(document, {
      viewColumn: fileState.viewColumn,
      preview: fileState.preview
    });

    if (fileState.cursor) {
      const position = new vscode.Position(fileState.cursor.line, fileState.cursor.column);
      editor.selection = new vscode.Selection(position, position);
    }

    if (fileState.scroll) {
      editor.revealRange(
        new vscode.Range(fileState.scroll.top, 0, fileState.scroll.top, 0),
        vscode.TextEditorRevealType.AtTop
      );
    }
  }
}
```

## Phase 3: Domain Layer (Week 3)

### Step 1: Domain Interfaces
```typescript
// src/domain/interfaces/IVSCodeSessionService.ts
import { VSCodeSession } from '@/shared/types/VSCodeTypes';
import { ExtensionError } from '@/shared/errors/ExtensionError';
import { Result } from 'codestate-core';

export interface SessionFilter {
  tags?: string[];
  search?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  projectRoot?: string;
  limit?: number;
  offset?: number;
}

export interface IVSCodeSessionService {
  saveSession(session: VSCodeSession): Promise<Result<void, ExtensionError>>;
  loadSession(sessionId: string): Promise<Result<VSCodeSession, ExtensionError>>;
  listSessions(filter?: SessionFilter): Promise<Result<VSCodeSession[], ExtensionError>>;
  deleteSession(sessionId: string): Promise<Result<void, ExtensionError>>;
  exportSession(sessionId: string, format: ExportFormat): Promise<Result<string, ExtensionError>>;
  importSession(data: string, format: ImportFormat): Promise<Result<VSCodeSession, ExtensionError>>;
}

export type ExportFormat = 'json' | 'yaml';
export type ImportFormat = 'json' | 'yaml';
```

### Step 2: Domain Services Implementation
```typescript
// src/domain/services/VSCodeSessionService.ts
import { IVSCodeSessionService, SessionFilter, ExportFormat, ImportFormat } from '@/domain/interfaces/IVSCodeSessionService';
import { VSCodeSession } from '@/shared/types/VSCodeTypes';
import { ExtensionError, ExtensionErrorCode } from '@/shared/errors/ExtensionError';
import { Result, success, failure } from 'codestate-core';
import { CodeStateCoreAdapter } from '@/infrastructure/adapters/CodeStateCoreAdapter';
import { VSCodeAPIAdapter } from '@/infrastructure/adapters/VSCodeAPIAdapter';

export class VSCodeSessionService implements IVSCodeSessionService {
  constructor(
    private coreAdapter: CodeStateCoreAdapter,
    private vscodeAdapter: VSCodeAPIAdapter
  ) {}

  async saveSession(session: VSCodeSession): Promise<Result<void, ExtensionError>> {
    try {
      // Capture current VS Code state
      const fileStates = await this.vscodeAdapter.captureFileStates();
      if (fileStates.ok) {
        session.vscodeState.openFiles = fileStates.value;
      }

      const terminalSessions = await this.vscodeAdapter.captureTerminalSessions();
      if (terminalSessions.ok) {
        session.vscodeState.terminalSessions = terminalSessions.value;
      }

      session.vscodeState.windowState = await this.vscodeAdapter.captureWindowState();

      // Save to core
      return await this.coreAdapter.saveSession(session);
    } catch (error) {
      return failure(new ExtensionError(
        'Failed to save session',
        ExtensionErrorCode.STORAGE_ERROR,
        error instanceof Error ? error : undefined
      ));
    }
  }

  async loadSession(sessionId: string): Promise<Result<VSCodeSession, ExtensionError>> {
    return await this.coreAdapter.loadSession(sessionId);
  }

  async listSessions(filter?: SessionFilter): Promise<Result<VSCodeSession[], ExtensionError>> {
    return await this.coreAdapter.listSessions(filter);
  }

  async deleteSession(sessionId: string): Promise<Result<void, ExtensionError>> {
    try {
      // Implementation using core adapter
      return success(undefined);
    } catch (error) {
      return failure(new ExtensionError(
        'Failed to delete session',
        ExtensionErrorCode.STORAGE_ERROR,
        error instanceof Error ? error : undefined
      ));
    }
  }

  async exportSession(sessionId: string, format: ExportFormat): Promise<Result<string, ExtensionError>> {
    try {
      const sessionResult = await this.loadSession(sessionId);
      if (!sessionResult.ok) {
        return sessionResult;
      }

      const session = sessionResult.value;
      const exportData = format === 'json' 
        ? JSON.stringify(session, null, 2)
        : this.convertToYaml(session);

      return success(exportData);
    } catch (error) {
      return failure(new ExtensionError(
        'Failed to export session',
        ExtensionErrorCode.STORAGE_ERROR,
        error instanceof Error ? error : undefined
      ));
    }
  }

  async importSession(data: string, format: ImportFormat): Promise<Result<VSCodeSession, ExtensionError>> {
    try {
      const session = format === 'json' 
        ? JSON.parse(data)
        : this.parseYaml(data);

      return success(session);
    } catch (error) {
      return failure(new ExtensionError(
        'Failed to import session',
        ExtensionErrorCode.INVALID_SESSION_DATA,
        error instanceof Error ? error : undefined
      ));
    }
  }

  private convertToYaml(session: VSCodeSession): string {
    // Simple YAML conversion - in production, use a proper YAML library
    return `name: ${session.name}\nprojectRoot: ${session.projectRoot}\ncreatedAt: ${session.createdAt}`;
  }

  private parseYaml(data: string): VSCodeSession {
    // Simple YAML parsing - in production, use a proper YAML library
    throw new Error('YAML parsing not implemented');
  }
}
```

## Phase 4: Application Layer (Week 4)

### Step 1: Use Cases
```typescript
// src/application/usecases/SaveSessionUseCase.ts
import { VSCodeSession } from '@/shared/types/VSCodeTypes';
import { ExtensionError } from '@/shared/errors/ExtensionError';
import { Result, success, failure } from 'codestate-core';
import { IVSCodeSessionService } from '@/domain/interfaces/IVSCodeSessionService';
import { VSCodeAPIAdapter } from '@/infrastructure/adapters/VSCodeAPIAdapter';

export interface SaveSessionInput {
  name: string;
  notes?: string;
  tags?: string[];
  autoStash?: boolean;
}

export class SaveSessionUseCase {
  constructor(
    private sessionService: IVSCodeSessionService,
    private vscodeAdapter: VSCodeAPIAdapter
  ) {}

  async execute(input: SaveSessionInput): Promise<Result<VSCodeSession, ExtensionError>> {
    try {
      // Validate input
      const validation = this.validateInput(input);
      if (!validation.ok) {
        return validation;
      }

      // Create session
      const session: VSCodeSession = {
        id: this.generateId(),
        name: input.name,
        projectRoot: this.getProjectRoot(),
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: input.tags || [],
        notes: input.notes,
        files: [],
        git: {
          branch: 'main',
          commit: 'unknown',
          isDirty: false
        },
        vscodeState: {
          openFiles: [],
          terminalSessions: [],
          workspaceFolders: [],
          windowState: {},
          gitState: {
            branch: 'main',
            commit: 'unknown',
            isDirty: false
          }
        },
        metadata: {
          vscodeVersion: 'unknown',
          extensionVersion: '0.0.1',
          captureTimestamp: new Date(),
          restoreCount: 0
        }
      };

      // Save session
      const saveResult = await this.sessionService.saveSession(session);
      if (!saveResult.ok) {
        return saveResult;
      }

      return success(session);
    } catch (error) {
      return failure(new ExtensionError(
        'Unexpected error during session save',
        ExtensionErrorCode.STORAGE_ERROR,
        error instanceof Error ? error : undefined
      ));
    }
  }

  private validateInput(input: SaveSessionInput): Result<void, ExtensionError> {
    if (!input.name || input.name.trim().length === 0) {
      return failure(new ExtensionError(
        'Session name cannot be empty',
        ExtensionErrorCode.VALIDATION_ERROR
      ));
    }

    if (input.name.length > 100) {
      return failure(new ExtensionError(
        'Session name cannot exceed 100 characters',
        ExtensionErrorCode.VALIDATION_ERROR
      ));
    }

    return success(undefined);
  }

  private generateId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getProjectRoot(): string {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    return workspaceFolders?.[0]?.uri.fsPath || '';
  }
}
```

### Step 2: Controllers
```typescript
// src/application/controllers/SessionController.ts
import { VSCodeSession } from '@/shared/types/VSCodeTypes';
import { ExtensionError } from '@/shared/errors/ExtensionError';
import { Result } from 'codestate-core';
import { SaveSessionUseCase, SaveSessionInput } from '@/application/usecases/SaveSessionUseCase';
import { ResumeSessionUseCase, ResumeSessionInput } from '@/application/usecases/ResumeSessionUseCase';
import { ListSessionsUseCase } from '@/application/usecases/ListSessionsUseCase';
import { DeleteSessionUseCase } from '@/application/usecases/DeleteSessionUseCase';

export class SessionController {
  constructor(
    private saveSessionUseCase: SaveSessionUseCase,
    private resumeSessionUseCase: ResumeSessionUseCase,
    private listSessionsUseCase: ListSessionsUseCase,
    private deleteSessionUseCase: DeleteSessionUseCase
  ) {}

  async saveSession(name: string, notes?: string, tags?: string[]): Promise<Result<VSCodeSession, ExtensionError>> {
    const input: SaveSessionInput = { name, notes, tags };
    return await this.saveSessionUseCase.execute(input);
  }

  async resumeSession(sessionId: string, restoreTerminals = true, restoreGitState = true): Promise<Result<void, ExtensionError>> {
    const input: ResumeSessionInput = { sessionId, restoreTerminals, restoreGitState };
    return await this.resumeSessionUseCase.execute(input);
  }

  async listSessions(filter?: SessionFilter): Promise<Result<VSCodeSession[], ExtensionError>> {
    return await this.listSessionsUseCase.execute(filter);
  }

  async deleteSession(sessionId: string): Promise<Result<void, ExtensionError>> {
    return await this.deleteSessionUseCase.execute(sessionId);
  }
}
```

## Phase 5: Presentation Layer (Week 5)

### Step 1: Commands
```typescript
// src/presentation/commands/SaveSessionCommand.ts
import * as vscode from 'vscode';
import { SessionController } from '@/application/controllers/SessionController';
import { ErrorHandler } from '@/shared/errors/ErrorHandler';
import { Messages } from '@/shared/constants/Messages';

export class SaveSessionCommand {
  constructor(private sessionController: SessionController) {}

  async execute(): Promise<void> {
    try {
      // Check if workspace is open
      if (!vscode.workspace.workspaceFolders?.length) {
        vscode.window.showErrorMessage(Messages.WORKSPACE_REQUIRED);
        return;
      }

      // Prompt for session name
      const sessionName = await vscode.window.showInputBox({
        prompt: Messages.SAVE_PROMPT,
        placeHolder: 'Enter a name for this session'
      });

      if (!sessionName) {
        return; // User cancelled
      }

      // Prompt for notes (optional)
      const notes = await vscode.window.showInputBox({
        prompt: 'Enter notes (optional):',
        placeHolder: 'Describe what you were working on'
      });

      // Save session
      const result = await this.sessionController.saveSession(sessionName, notes);
      
      if (result.ok) {
        vscode.window.showInformationMessage(
          Messages.SESSION_SAVED.replace('{name}', sessionName)
        );
      } else {
        ErrorHandler.handle(result.error, 'SaveSessionCommand');
      }
    } catch (error) {
      ErrorHandler.handle(error, 'SaveSessionCommand');
    }
  }
}
```

### Step 2: Tree View Provider
```typescript
// src/presentation/views/SessionsTreeDataProvider.ts
import * as vscode from 'vscode';
import { VSCodeSession } from '@/shared/types/VSCodeTypes';
import { SessionController } from '@/application/controllers/SessionController';
import { SessionTreeItem } from './SessionTreeItem';

export class SessionsTreeDataProvider implements vscode.TreeDataProvider<SessionTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<SessionTreeItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private sessions: VSCodeSession[] = [];
  private loaded = false;

  constructor(private sessionController: SessionController) {}

  async getChildren(element?: SessionTreeItem): Promise<SessionTreeItem[]> {
    if (!this.loaded) {
      await this.loadSessions();
    }
    
    if (!element) {
      return this.createRootItems();
    }
    
    return element.getChildren();
  }

  getTreeItem(element: SessionTreeItem): vscode.TreeItem {
    return element;
  }

  async refresh(): Promise<void> {
    this.loaded = false;
    this._onDidChangeTreeData.fire(undefined);
  }

  private async loadSessions(): Promise<void> {
    const result = await this.sessionController.listSessions();
    if (result.ok) {
      this.sessions = result.value;
      this.loaded = true;
    }
  }

  private createRootItems(): SessionTreeItem[] {
    return this.sessions.map(session => new SessionTreeItem(session));
  }
}
```

## Phase 6: Main Extension (Week 6)

### Step 1: Dependency Injection Container
```typescript
// src/infrastructure/Container.ts
import { CodeStateCoreAdapter } from '@/infrastructure/adapters/CodeStateCoreAdapter';
import { VSCodeAPIAdapter } from '@/infrastructure/adapters/VSCodeAPIAdapter';
import { VSCodeSessionService } from '@/domain/services/VSCodeSessionService';
import { SaveSessionUseCase } from '@/application/usecases/SaveSessionUseCase';
import { ResumeSessionUseCase } from '@/application/usecases/ResumeSessionUseCase';
import { ListSessionsUseCase } from '@/application/usecases/ListSessionsUseCase';
import { DeleteSessionUseCase } from '@/application/usecases/DeleteSessionUseCase';
import { SessionController } from '@/application/controllers/SessionController';
import { SaveSessionCommand } from '@/presentation/commands/SaveSessionCommand';
import { ResumeSessionCommand } from '@/presentation/commands/ResumeSessionCommand';
import { ListSessionsCommand } from '@/presentation/commands/ListSessionsCommand';
import { DeleteSessionCommand } from '@/presentation/commands/DeleteSessionCommand';
import { SessionsTreeDataProvider } from '@/presentation/views/SessionsTreeDataProvider';

export class Container {
  private static instance: Container;
  
  // Infrastructure
  public readonly coreAdapter: CodeStateCoreAdapter;
  public readonly vscodeAdapter: VSCodeAPIAdapter;
  
  // Domain
  public readonly sessionService: VSCodeSessionService;
  
  // Application
  public readonly saveSessionUseCase: SaveSessionUseCase;
  public readonly resumeSessionUseCase: ResumeSessionUseCase;
  public readonly listSessionsUseCase: ListSessionsUseCase;
  public readonly deleteSessionUseCase: DeleteSessionUseCase;
  public readonly sessionController: SessionController;
  
  // Presentation
  public readonly saveSessionCommand: SaveSessionCommand;
  public readonly resumeSessionCommand: ResumeSessionCommand;
  public readonly listSessionsCommand: ListSessionsCommand;
  public readonly deleteSessionCommand: DeleteSessionCommand;
  public readonly sessionsTreeProvider: SessionsTreeDataProvider;

  private constructor() {
    // Initialize infrastructure
    this.coreAdapter = new CodeStateCoreAdapter();
    this.vscodeAdapter = new VSCodeAPIAdapter();
    
    // Initialize domain
    this.sessionService = new VSCodeSessionService(this.coreAdapter, this.vscodeAdapter);
    
    // Initialize application
    this.saveSessionUseCase = new SaveSessionUseCase(this.sessionService, this.vscodeAdapter);
    this.resumeSessionUseCase = new ResumeSessionUseCase(this.sessionService, this.vscodeAdapter);
    this.listSessionsUseCase = new ListSessionsUseCase(this.sessionService);
    this.deleteSessionUseCase = new DeleteSessionUseCase(this.sessionService);
    this.sessionController = new SessionController(
      this.saveSessionUseCase,
      this.resumeSessionUseCase,
      this.listSessionsUseCase,
      this.deleteSessionUseCase
    );
    
    // Initialize presentation
    this.saveSessionCommand = new SaveSessionCommand(this.sessionController);
    this.resumeSessionCommand = new ResumeSessionCommand(this.sessionController);
    this.listSessionsCommand = new ListSessionsCommand(this.sessionController);
    this.deleteSessionCommand = new DeleteSessionCommand(this.sessionController);
    this.sessionsTreeProvider = new SessionsTreeDataProvider(this.sessionController);
  }

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }
}
```

### Step 2: Main Extension File
```typescript
// src/extension.ts
import * as vscode from 'vscode';
import { Container } from '@/infrastructure/Container';
import { Commands, Views } from '@/shared/constants/Commands';
import { ErrorHandler } from '@/shared/errors/ErrorHandler';

export function activate(context: vscode.ExtensionContext) {
  console.log('CodeState extension is now active!');

  try {
    const container = Container.getInstance();

    // Register commands
    const saveSessionDisposable = vscode.commands.registerCommand(
      Commands.SAVE_SESSION,
      () => container.saveSessionCommand.execute()
    );

    const resumeSessionDisposable = vscode.commands.registerCommand(
      Commands.RESUME_SESSION,
      () => container.resumeSessionCommand.execute()
    );

    const listSessionsDisposable = vscode.commands.registerCommand(
      Commands.LIST_SESSIONS,
      () => container.listSessionsCommand.execute()
    );

    const deleteSessionDisposable = vscode.commands.registerCommand(
      Commands.DELETE_SESSION,
      (sessionId: string) => container.deleteSessionCommand.execute(sessionId)
    );

    // Register tree view
    const treeDataProvider = container.sessionsTreeProvider;
    const treeViewDisposable = vscode.window.registerTreeDataProvider(
      Views.SESSIONS_TREE,
      treeDataProvider
    );

    // Add disposables to context
    context.subscriptions.push(
      saveSessionDisposable,
      resumeSessionDisposable,
      listSessionsDisposable,
      deleteSessionDisposable,
      treeViewDisposable
    );

    console.log('CodeState extension commands and views registered successfully');
  } catch (error) {
    ErrorHandler.handle(error, 'Extension Activation');
  }
}

export function deactivate() {
  console.log('CodeState extension is now deactivated');
}
```

## Testing Strategy

### Unit Tests Example
```typescript
// src/test/unit/application/usecases/SaveSessionUseCase.test.ts
import { SaveSessionUseCase, SaveSessionInput } from '@/application/usecases/SaveSessionUseCase';
import { IVSCodeSessionService } from '@/domain/interfaces/IVSCodeSessionService';
import { VSCodeAPIAdapter } from '@/infrastructure/adapters/VSCodeAPIAdapter';
import { VSCodeSession } from '@/shared/types/VSCodeTypes';
import { ExtensionError, ExtensionErrorCode } from '@/shared/errors/ExtensionError';
import { Result, success, failure } from 'codestate-core';

describe('SaveSessionUseCase', () => {
  let useCase: SaveSessionUseCase;
  let mockSessionService: jest.Mocked<IVSCodeSessionService>;
  let mockVSCodeAdapter: jest.Mocked<VSCodeAPIAdapter>;

  beforeEach(() => {
    mockSessionService = {
      saveSession: jest.fn(),
      loadSession: jest.fn(),
      listSessions: jest.fn(),
      deleteSession: jest.fn(),
      exportSession: jest.fn(),
      importSession: jest.fn()
    };

    mockVSCodeAdapter = {
      captureFileStates: jest.fn(),
      restoreFileStates: jest.fn(),
      captureTerminalSessions: jest.fn(),
      captureWindowState: jest.fn()
    };

    useCase = new SaveSessionUseCase(mockSessionService, mockVSCodeAdapter);
  });

  describe('execute', () => {
    it('should successfully save a session with valid input', async () => {
      // Given
      const input: SaveSessionInput = {
        name: 'test-session',
        notes: 'Test session',
        tags: ['test', 'demo']
      };

      const expectedSession: VSCodeSession = {
        id: expect.any(String),
        name: 'test-session',
        projectRoot: expect.any(String),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        tags: ['test', 'demo'],
        notes: 'Test session',
        files: [],
        git: {
          branch: 'main',
          commit: 'unknown',
          isDirty: false
        },
        vscodeState: {
          openFiles: [],
          terminalSessions: [],
          workspaceFolders: [],
          windowState: {},
          gitState: {
            branch: 'main',
            commit: 'unknown',
            isDirty: false
          }
        },
        metadata: {
          vscodeVersion: 'unknown',
          extensionVersion: '0.0.1',
          captureTimestamp: expect.any(Date),
          restoreCount: 0
        }
      };

      mockSessionService.saveSession.mockResolvedValue(success(undefined));

      // When
      const result = await useCase.execute(input);

      // Then
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(expectedSession);
        expect(mockSessionService.saveSession).toHaveBeenCalledWith(expectedSession);
      }
    });

    it('should return error for empty session name', async () => {
      // Given
      const input: SaveSessionInput = { name: '' };

      // When
      const result = await useCase.execute(input);

      // Then
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ExtensionErrorCode.VALIDATION_ERROR);
        expect(result.error.message).toContain('Session name cannot be empty');
      }
    });

    it('should return error for session name too long', async () => {
      // Given
      const input: SaveSessionInput = { 
        name: 'a'.repeat(101) 
      };

      // When
      const result = await useCase.execute(input);

      // Then
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ExtensionErrorCode.VALIDATION_ERROR);
        expect(result.error.message).toContain('Session name cannot exceed 100 characters');
      }
    });
  });
});
```

## Next Steps

1. **Install Dependencies**: Run `npm install` to install the new dependencies
2. **Create Directory Structure**: Create all the directories and files as outlined above
3. **Start with Foundation**: Begin with the shared types and error handling
4. **Build Infrastructure**: Implement the adapters and services
5. **Add Application Logic**: Create use cases and controllers
6. **Create UI**: Implement commands and tree views
7. **Test Thoroughly**: Write comprehensive tests for each layer
8. **Polish and Optimize**: Add performance optimizations and error handling

This roadmap provides a solid foundation for building the CodeState VS Code extension following clean architecture principles, SOLID principles, and best practices for maintainable, testable code. 