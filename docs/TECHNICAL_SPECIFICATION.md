# CodeState VS Code Extension Technical Specification

## Overview

This document provides detailed technical specifications for implementing the CodeState VS Code extension, including architecture patterns, data models, interfaces, and implementation guidelines.

## Architecture Patterns

### 1. Clean Architecture Implementation

#### Domain Layer (Innermost)
```typescript
// Core business entities and rules
interface VSCodeSession extends Session {
  vscodeState: VSCodeState;
}

interface VSCodeState {
  openFiles: VSCodeFileState[];
  activeEditor?: string;
  terminalSessions: TerminalSession[];
  workspaceFolders: string[];
  windowState: WindowState;
}

interface VSCodeFileState extends FileState {
  viewColumn?: number;
  isVisible: boolean;
  isPinned: boolean;
  preview: boolean;
}
```

#### Application Layer
```typescript
// Use cases and application services
interface SaveSessionInput {
  name: string;
  notes?: string;
  tags?: string[];
  autoStash?: boolean;
}

interface ResumeSessionInput {
  sessionId: string;
  restoreTerminals?: boolean;
  restoreGitState?: boolean;
}

class SaveSessionUseCase {
  async execute(input: SaveSessionInput): Promise<Result<VSCodeSession, ExtensionError>>;
}

class ResumeSessionUseCase {
  async execute(input: ResumeSessionInput): Promise<Result<void, ExtensionError>>;
}
```

#### Infrastructure Layer
```typescript
// External interfaces and implementations
interface IVSCodeSessionService {
  saveSession(session: VSCodeSession): Promise<Result<void, ExtensionError>>;
  loadSession(sessionId: string): Promise<Result<VSCodeSession, ExtensionError>>;
  listSessions(filter?: SessionFilter): Promise<Result<VSCodeSession[], ExtensionError>>;
  deleteSession(sessionId: string): Promise<Result<void, ExtensionError>>;
}

interface IVSCodeFileService {
  captureFileStates(): Promise<Result<VSCodeFileState[], ExtensionError>>;
  restoreFileStates(states: VSCodeFileState[]): Promise<Result<void, ExtensionError>>;
  openFile(fileState: VSCodeFileState): Promise<Result<void, ExtensionError>>;
}
```

### 2. SOLID Principles Implementation

#### Single Responsibility Principle
```typescript
// Each class has one reason to change
class VSCodeSessionService implements IVSCodeSessionService {
  // Only handles session persistence
}

class VSCodeFileService implements IVSCodeFileService {
  // Only handles file state management
}

class VSCodeTerminalService implements IVSCodeTerminalService {
  // Only handles terminal session management
}
```

#### Open/Closed Principle
```typescript
// Open for extension, closed for modification
interface ISessionStorage {
  save(session: VSCodeSession): Promise<Result<void, ExtensionError>>;
  load(sessionId: string): Promise<Result<VSCodeSession, ExtensionError>>;
}

class FileSystemSessionStorage implements ISessionStorage {
  // File system implementation
}

class CloudSessionStorage implements ISessionStorage {
  // Cloud storage implementation
}
```

#### Liskov Substitution Principle
```typescript
// All implementations are substitutable
class SessionManager {
  constructor(private storage: ISessionStorage) {}
  
  async saveSession(session: VSCodeSession): Promise<Result<void, ExtensionError>> {
    return this.storage.save(session);
  }
}
```

#### Interface Segregation Principle
```typescript
// Small, focused interfaces
interface IFileStateCapture {
  captureCurrentState(): Promise<Result<VSCodeFileState[], ExtensionError>>;
}

interface IFileStateRestoration {
  restoreState(states: VSCodeFileState[]): Promise<Result<void, ExtensionError>>;
}

interface IVSCodeFileService extends IFileStateCapture, IFileStateRestoration {}
```

#### Dependency Inversion Principle
```typescript
// High-level modules depend on abstractions
class SaveSessionUseCase {
  constructor(
    private sessionService: IVSCodeSessionService,
    private fileService: IVSCodeFileService,
    private terminalService: IVSCodeTerminalService,
    private gitService: IGitService
  ) {}
}
```

## Data Models

### 1. Core Entities

#### VSCodeSession
```typescript
interface VSCodeSession extends Session {
  vscodeState: VSCodeState;
  metadata: SessionMetadata;
}

interface VSCodeState {
  openFiles: VSCodeFileState[];
  activeEditor?: string;
  terminalSessions: TerminalSession[];
  workspaceFolders: string[];
  windowState: WindowState;
  gitState: GitState;
}

interface SessionMetadata {
  vscodeVersion: string;
  extensionVersion: string;
  captureTimestamp: Date;
  restoreCount: number;
  lastRestored?: Date;
}
```

#### VSCodeFileState
```typescript
interface VSCodeFileState extends FileState {
  viewColumn?: number;
  isVisible: boolean;
  isPinned: boolean;
  preview: boolean;
  languageId?: string;
  selections?: Selection[];
  decorations?: Decoration[];
}
```

#### TerminalSession
```typescript
interface TerminalSession {
  id: string;
  name: string;
  shellPath: string;
  shellArgs: string[];
  cwd: string;
  env: Record<string, string>;
  commands: string[];
  isActive: boolean;
}
```

### 2. Value Objects

#### Selection
```typescript
interface Selection {
  anchor: Position;
  active: Position;
  start: Position;
  end: Position;
  isEmpty: boolean;
  isReversed: boolean;
}

interface Position {
  line: number;
  character: number;
}
```

#### Decoration
```typescript
interface Decoration {
  range: Range;
  hoverMessage?: string;
  renderOptions?: DecorationRenderOptions;
}
```

## Service Interfaces

### 1. Session Management

#### IVSCodeSessionService
```typescript
interface IVSCodeSessionService {
  saveSession(session: VSCodeSession): Promise<Result<void, ExtensionError>>;
  loadSession(sessionId: string): Promise<Result<VSCodeSession, ExtensionError>>;
  listSessions(filter?: SessionFilter): Promise<Result<VSCodeSession[], ExtensionError>>;
  deleteSession(sessionId: string): Promise<Result<void, ExtensionError>>;
  exportSession(sessionId: string, format: ExportFormat): Promise<Result<string, ExtensionError>>;
  importSession(data: string, format: ImportFormat): Promise<Result<VSCodeSession, ExtensionError>>;
}
```

#### SessionFilter
```typescript
interface SessionFilter {
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
```

### 2. File State Management

#### IVSCodeFileService
```typescript
interface IVSCodeFileService {
  captureFileStates(): Promise<Result<VSCodeFileState[], ExtensionError>>;
  restoreFileStates(states: VSCodeFileState[]): Promise<Result<void, ExtensionError>>;
  openFile(fileState: VSCodeFileState): Promise<Result<void, ExtensionError>>;
  closeFile(filePath: string): Promise<Result<void, ExtensionError>>;
  getActiveEditor(): Promise<Result<VSCodeFileState | undefined, ExtensionError>>;
  setActiveEditor(filePath: string): Promise<Result<void, ExtensionError>>;
}
```

### 3. Terminal Management

#### IVSCodeTerminalService
```typescript
interface IVSCodeTerminalService {
  captureTerminalSessions(): Promise<Result<TerminalSession[], ExtensionError>>;
  restoreTerminalSessions(sessions: TerminalSession[]): Promise<Result<void, ExtensionError>>;
  createTerminal(session: TerminalSession): Promise<Result<void, ExtensionError>>;
  closeTerminal(terminalId: string): Promise<Result<void, ExtensionError>>;
  executeCommand(terminalId: string, command: string): Promise<Result<void, ExtensionError>>;
}
```

### 4. Git Integration

#### IVSCodeGitService
```typescript
interface IVSCodeGitService {
  captureGitState(): Promise<Result<GitState, ExtensionError>>;
  restoreGitState(state: GitState): Promise<Result<void, ExtensionError>>;
  createStash(message?: string): Promise<Result<string, ExtensionError>>;
  applyStash(stashId: string): Promise<Result<void, ExtensionError>>;
  getCurrentBranch(): Promise<Result<string, ExtensionError>>;
  getCurrentCommit(): Promise<Result<string, ExtensionError>>;
  isDirty(): Promise<Result<boolean, ExtensionError>>;
}
```

## Use Case Implementations

### 1. Save Session Use Case

```typescript
class SaveSessionUseCase {
  constructor(
    private sessionService: IVSCodeSessionService,
    private fileService: IVSCodeFileService,
    private terminalService: IVSCodeTerminalService,
    private gitService: IVSCodeGitService,
    private workspaceService: IVSCodeWorkspaceService
  ) {}

  async execute(input: SaveSessionInput): Promise<Result<VSCodeSession, ExtensionError>> {
    try {
      // 1. Capture current workspace state
      const workspaceState = await this.captureWorkspaceState();
      if (isFailure(workspaceState)) {
        return workspaceState;
      }

      // 2. Capture file states
      const fileStates = await this.fileService.captureFileStates();
      if (isFailure(fileStates)) {
        return failure(new ExtensionError('Failed to capture file states', fileStates.error));
      }

      // 3. Capture terminal sessions
      const terminalSessions = await this.terminalService.captureTerminalSessions();
      if (isFailure(terminalSessions)) {
        return failure(new ExtensionError('Failed to capture terminal sessions', terminalSessions.error));
      }

      // 4. Capture git state
      const gitState = await this.gitService.captureGitState();
      if (isFailure(gitState)) {
        return failure(new ExtensionError('Failed to capture git state', gitState.error));
      }

      // 5. Create session
      const session: VSCodeSession = {
        id: generateId(),
        name: input.name,
        projectRoot: workspaceState.value.rootPath,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: input.tags || [],
        notes: input.notes,
        files: fileStates.value,
        git: gitState.value,
        vscodeState: {
          openFiles: fileStates.value,
          activeEditor: await this.getActiveEditorPath(),
          terminalSessions: terminalSessions.value,
          workspaceFolders: workspaceState.value.folders,
          windowState: await this.captureWindowState(),
          gitState: gitState.value
        },
        metadata: {
          vscodeVersion: vscode.version,
          extensionVersion: getExtensionVersion(),
          captureTimestamp: new Date(),
          restoreCount: 0
        }
      };

      // 6. Save session
      const saveResult = await this.sessionService.saveSession(session);
      if (isFailure(saveResult)) {
        return failure(new ExtensionError('Failed to save session', saveResult.error));
      }

      return success(session);
    } catch (error) {
      return failure(new ExtensionError('Unexpected error during session save', error));
    }
  }

  private async captureWorkspaceState(): Promise<Result<WorkspaceState, ExtensionError>> {
    // Implementation
  }

  private async getActiveEditorPath(): Promise<string | undefined> {
    // Implementation
  }

  private async captureWindowState(): Promise<WindowState> {
    // Implementation
  }
}
```

### 2. Resume Session Use Case

```typescript
class ResumeSessionUseCase {
  constructor(
    private sessionService: IVSCodeSessionService,
    private fileService: IVSCodeFileService,
    private terminalService: IVSCodeTerminalService,
    private gitService: IVSCodeGitService,
    private workspaceService: IVSCodeWorkspaceService
  ) {}

  async execute(input: ResumeSessionInput): Promise<Result<void, ExtensionError>> {
    try {
      // 1. Load session
      const sessionResult = await this.sessionService.loadSession(input.sessionId);
      if (isFailure(sessionResult)) {
        return failure(new ExtensionError('Failed to load session', sessionResult.error));
      }

      const session = sessionResult.value;

      // 2. Validate workspace
      const workspaceValidation = await this.validateWorkspace(session);
      if (isFailure(workspaceValidation)) {
        return workspaceValidation;
      }

      // 3. Restore git state
      if (input.restoreGitState) {
        const gitRestore = await this.gitService.restoreGitState(session.git);
        if (isFailure(gitRestore)) {
          return failure(new ExtensionError('Failed to restore git state', gitRestore.error));
        }
      }

      // 4. Restore file states
      const fileRestore = await this.fileService.restoreFileStates(session.vscodeState.openFiles);
      if (isFailure(fileRestore)) {
        return failure(new ExtensionError('Failed to restore file states', fileRestore.error));
      }

      // 5. Restore terminal sessions
      if (input.restoreTerminals) {
        const terminalRestore = await this.terminalService.restoreTerminalSessions(
          session.vscodeState.terminalSessions
        );
        if (isFailure(terminalRestore)) {
          return failure(new ExtensionError('Failed to restore terminal sessions', terminalRestore.error));
        }
      }

      // 6. Restore window state
      await this.restoreWindowState(session.vscodeState.windowState);

      // 7. Update session metadata
      await this.updateSessionMetadata(session);

      return success(undefined);
    } catch (error) {
      return failure(new ExtensionError('Unexpected error during session resume', error));
    }
  }

  private async validateWorkspace(session: VSCodeSession): Promise<Result<void, ExtensionError>> {
    // Implementation
  }

  private async restoreWindowState(windowState: WindowState): Promise<void> {
    // Implementation
  }

  private async updateSessionMetadata(session: VSCodeSession): Promise<void> {
    // Implementation
  }
}
```

## Error Handling

### 1. Error Types

```typescript
enum ExtensionErrorCode {
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

class ExtensionError extends Error {
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

### 2. Error Handler

```typescript
class ErrorHandler {
  static handle(error: Error, context: string): void {
    if (error instanceof ExtensionError) {
      vscode.window.showErrorMessage(error.userMessage);
      console.error(`[${context}] ${error.message}`, error.context);
    } else {
      vscode.window.showErrorMessage(`An unexpected error occurred in ${context}`);
      console.error(`[${context}] Unexpected error:`, error);
    }
  }

  static async handleAsync<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<Result<T, ExtensionError>> {
    try {
      const result = await operation();
      return success(result);
    } catch (error) {
      this.handle(error, context);
      return failure(new ExtensionError(
        `Operation failed in ${context}`,
        ExtensionErrorCode.VSCODE_API_ERROR,
        error instanceof Error ? error : undefined
      ));
    }
  }
}
```

## Testing Strategy

### 1. Unit Testing

```typescript
describe('SaveSessionUseCase', () => {
  let useCase: SaveSessionUseCase;
  let mockSessionService: jest.Mocked<IVSCodeSessionService>;
  let mockFileService: jest.Mocked<IVSCodeFileService>;
  let mockTerminalService: jest.Mocked<IVSCodeTerminalService>;
  let mockGitService: jest.Mocked<IVSCodeGitService>;

  beforeEach(() => {
    mockSessionService = createMockSessionService();
    mockFileService = createMockFileService();
    mockTerminalService = createMockTerminalService();
    mockGitService = createMockGitService();

    useCase = new SaveSessionUseCase(
      mockSessionService,
      mockFileService,
      mockTerminalService,
      mockGitService
    );
  });

  describe('execute', () => {
    it('should successfully save a session with all components', async () => {
      // Given
      const input: SaveSessionInput = {
        name: 'test-session',
        notes: 'Test session',
        tags: ['test', 'demo']
      };

      mockFileService.captureFileStates.mockResolvedValue(success([]));
      mockTerminalService.captureTerminalSessions.mockResolvedValue(success([]));
      mockGitService.captureGitState.mockResolvedValue(success({
        branch: 'main',
        commit: 'abc123',
        isDirty: false
      }));
      mockSessionService.saveSession.mockResolvedValue(success(undefined));

      // When
      const result = await useCase.execute(input);

      // Then
      expect(isSuccess(result)).toBe(true);
      expect(mockSessionService.saveSession).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'test-session',
          notes: 'Test session',
          tags: ['test', 'demo']
        })
      );
    });

    it('should handle file service failure gracefully', async () => {
      // Given
      const input: SaveSessionInput = { name: 'test-session' };
      const fileError = new ExtensionError('File capture failed', ExtensionErrorCode.FILE_NOT_FOUND);
      mockFileService.captureFileStates.mockResolvedValue(failure(fileError));

      // When
      const result = await useCase.execute(input);

      // Then
      expect(isFailure(result)).toBe(true);
      expect(result.error.code).toBe(ExtensionErrorCode.FILE_NOT_FOUND);
    });
  });
});
```

### 2. Integration Testing

```typescript
describe('Session Management Integration', () => {
  let extension: CodeStateExtension;

  beforeEach(async () => {
    extension = new CodeStateExtension();
    await extension.activate();
  });

  afterEach(async () => {
    await extension.deactivate();
  });

  it('should save and resume a complete session', async () => {
    // Given
    const sessionName = 'integration-test-session';
    
    // Create test files
    const testFile = await createTestFile('test.js', 'console.log("test");');
    
    // Open file in editor
    await vscode.workspace.openTextDocument(testFile);
    await vscode.window.showTextDocument(testFile);

    // When - Save session
    const saveResult = await extension.executeCommand('codestate.saveSession', sessionName);
    
    // Then
    expect(saveResult.success).toBe(true);

    // When - Close file and resume session
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    const resumeResult = await extension.executeCommand('codestate.resumeSession', sessionName);
    
    // Then
    expect(resumeResult.success).toBe(true);
    
    // Verify file is reopened
    const activeEditor = vscode.window.activeTextEditor;
    expect(activeEditor?.document.fileName).toBe(testFile.fsPath);
  });
});
```

## Performance Considerations

### 1. Lazy Loading

```typescript
class SessionsTreeDataProvider implements vscode.TreeDataProvider<SessionTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<SessionTreeItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private sessions: VSCodeSession[] = [];
  private loaded = false;

  async getChildren(element?: SessionTreeItem): Promise<SessionTreeItem[]> {
    if (!this.loaded) {
      await this.loadSessions();
    }
    
    if (!element) {
      return this.createRootItems();
    }
    
    return element.getChildren();
  }

  private async loadSessions(): Promise<void> {
    const result = await this.sessionService.listSessions();
    if (isSuccess(result)) {
      this.sessions = result.value;
      this.loaded = true;
    }
  }
}
```

### 2. Caching

```typescript
class SessionCache {
  private cache = new Map<string, { session: VSCodeSession; timestamp: number }>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  async get(sessionId: string): Promise<VSCodeSession | undefined> {
    const cached = this.cache.get(sessionId);
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return cached.session;
    }
    return undefined;
  }

  set(sessionId: string, session: VSCodeSession): void {
    this.cache.set(sessionId, { session, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }
}
```

### 3. Batch Operations

```typescript
class BatchFileService implements IVSCodeFileService {
  private batchSize = 10;
  private batchDelay = 100; // ms

  async restoreFileStates(states: VSCodeFileState[]): Promise<Result<void, ExtensionError>> {
    const batches = this.createBatches(states, this.batchSize);
    
    for (const batch of batches) {
      await this.restoreBatch(batch);
      await this.delay(this.batchDelay);
    }
    
    return success(undefined);
  }

  private async restoreBatch(states: VSCodeFileState[]): Promise<void> {
    const promises = states.map(state => this.openFile(state));
    await Promise.all(promises);
  }
}
```

## Security Considerations

### 1. Input Validation

```typescript
class InputValidator {
  static validateSessionName(name: string): Result<string, ExtensionError> {
    if (!name || name.trim().length === 0) {
      return failure(new ExtensionError(
        'Session name cannot be empty',
        ExtensionErrorCode.VALIDATION_ERROR
      ));
    }

    if (name.length > 100) {
      return failure(new ExtensionError(
        'Session name cannot exceed 100 characters',
        ExtensionErrorCode.VALIDATION_ERROR
      ));
    }

    if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
      return failure(new ExtensionError(
        'Session name contains invalid characters',
        ExtensionErrorCode.VALIDATION_ERROR
      ));
    }

    return success(name.trim());
  }

  static validateFilePath(path: string): Result<string, ExtensionError> {
    if (!path || path.trim().length === 0) {
      return failure(new ExtensionError(
        'File path cannot be empty',
        ExtensionErrorCode.VALIDATION_ERROR
      ));
    }

    // Check for path traversal attempts
    if (path.includes('..') || path.includes('~')) {
      return failure(new ExtensionError(
        'Invalid file path',
        ExtensionErrorCode.VALIDATION_ERROR
      ));
    }

    return success(path);
  }
}
```

### 2. Data Sanitization

```typescript
class DataSanitizer {
  static sanitizeSession(session: VSCodeSession): VSCodeSession {
    return {
      ...session,
      name: this.sanitizeString(session.name),
      notes: session.notes ? this.sanitizeString(session.notes) : undefined,
      tags: session.tags.map(tag => this.sanitizeString(tag)),
      files: session.files.map(file => this.sanitizeFileState(file))
    };
  }

  private static sanitizeString(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .substring(0, 1000); // Limit length
  }

  private static sanitizeFileState(fileState: VSCodeFileState): VSCodeFileState {
    return {
      ...fileState,
      path: this.sanitizeFilePath(fileState.path)
    };
  }

  private static sanitizeFilePath(path: string): string {
    // Remove any potential path traversal
    return path.replace(/\.\./g, '').replace(/~/g, '');
  }
}
```

## Conclusion

This technical specification provides a comprehensive foundation for implementing the CodeState VS Code extension with clean architecture, SOLID principles, and best practices. The modular design ensures maintainability, testability, and extensibility while meeting the functional requirements outlined in the product specification.

The implementation follows TypeScript best practices, includes comprehensive error handling, and provides a robust testing strategy to achieve the 90% code coverage target. The performance optimizations and security considerations ensure the extension is production-ready and user-friendly. 