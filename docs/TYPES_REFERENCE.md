# Types Reference

This document provides a comprehensive reference of all types exported by the `codestate-core` package.

## Table of Contents

- [Core Data Models](#core-data-models)
- [Configuration Types](#configuration-types)
- [Result Types](#result-types)
- [Service Interfaces](#service-interfaces)
- [Use Case Classes](#use-case-classes)
- [Git Types](#git-types)
- [IDE Types](#ide-types)
- [Error Types](#error-types)
- [Logger Types](#logger-types)
- [Terminal Types](#terminal-types)
- [Facade Classes](#facade-classes)

---

## Core Data Models

### Session
Represents a development session with project state, files, and git information.

```typescript
interface Session {
  id: string;
  name: string;
  projectRoot: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  notes?: string;
  files: FileState[];
  git: GitState;
  extensions?: Record<string, unknown>;
}
```

### FileState
Represents the state of a file in an IDE session.

```typescript
interface FileState {
  path: string;
  cursor?: {
    line: number;
    column: number;
  };
  scroll?: {
    top: number;
    left: number;
  };
  isActive: boolean;
}
```

### GitState
Represents the current git state of a project.

```typescript
interface GitState {
  branch: string;
  commit: string;
  isDirty: boolean;
  stashId?: string | null;
}
```

### Script
Represents a script that can be executed.

```typescript
interface Script {
  name: string;
  rootPath: string;
  script: string;
}
```

### ScriptIndexEntry
Represents an entry in the script index.

```typescript
interface ScriptIndexEntry {
  rootPath: string;
  referenceFile: string;
}
```

### ScriptIndex
Represents the complete script index.

```typescript
interface ScriptIndex {
  entries: ScriptIndexEntry[];
}
```

### ScriptCollection
Represents a collection of scripts.

```typescript
interface ScriptCollection {
  scripts: Script[];
}
```

---

## Configuration Types

### LoggerConfig
Configuration for the logging system.

```typescript
type LoggerConfig = {
  level: "ERROR" | "WARN" | "LOG" | "DEBUG";
  sinks: ("file" | "console")[];
  filePath?: string;
}
```

### EncryptionConfig
Configuration for encryption settings.

```typescript
interface EncryptionConfig {
  enabled: boolean;
  encryptionKey?: string;
}
```

### Config
Main application configuration.

```typescript
interface Config {
  version: string;
  ide: string;
  encryption: EncryptionConfig;
  storagePath: string;
  logger: LoggerConfig;
  experimental?: Record<string, boolean>;
  extensions?: Record<string, unknown>;
}
```

---

## Result Types

### Result<T, E>
Generic result type for operations that can succeed or fail.

```typescript
type Result<T, E = Error> = Success<T> | Failure<E>;
```

### Success<T>
Represents a successful operation result.

```typescript
interface Success<T> {
  ok: true;
  value: T;
}
```

### Failure<E>
Represents a failed operation result.

```typescript
interface Failure<E> {
  ok: false;
  error: E;
}
```

### Utility Functions
- `isSuccess<T, E>(result: Result<T, E>): result is Success<T>`
- `isFailure<T, E>(result: Result<T, E>): result is Failure<E>`

---

## Service Interfaces

### IConfigService
Interface for configuration management.

```typescript
interface IConfigService {
  getConfig(): Promise<Result<Config>>;
  setConfig(config: Config): Promise<Result<void>>;
  updateConfig(partial: Partial<Config>): Promise<Result<Config>>;
}
```

### IScriptService
Interface for script management.

```typescript
interface IScriptService {
  createScript(script: Script): Promise<Result<void>>;
  createScripts(scripts: Script[]): Promise<Result<void>>;
  getScriptsByRootPath(rootPath: string): Promise<Result<Script[]>>;
  getAllScripts(): Promise<Result<Script[]>>;
  updateScript(name: string, rootPath: string, script: Partial<Script>): Promise<Result<void>>;
  updateScripts(updates: Array<{name: string; rootPath: string; script: Partial<Script>}>): Promise<Result<void>>;
  deleteScript(name: string, rootPath: string): Promise<Result<void>>;
  deleteScripts(scripts: Array<{name: string; rootPath: string}>): Promise<Result<void>>;
  deleteScriptsByRootPath(rootPath: string): Promise<Result<void>>;
  getScriptIndex(): Promise<Result<ScriptIndex>>;
  updateScriptIndex(index: ScriptIndex): Promise<Result<void>>;
}
```

### ISessionService
Interface for session management.

```typescript
interface ISessionService {
  saveSession(input: Partial<Session> & {name: string; projectRoot: string; notes?: string; tags?: string[]}): Promise<Result<Session>>;
  updateSession(idOrName: string, input: Partial<Session> & {notes?: string; tags?: string[]}): Promise<Result<Session>>;
  resumeSession(idOrName: string): Promise<Result<Session>>;
  listSessions(filter?: {tags?: string[]; search?: string}): Promise<Result<Session[]>>;
  deleteSession(idOrName: string): Promise<Result<void>>;
  exportSession(idOrName: string, outputPath: string): Promise<Result<string>>;
  importSession(filePath: string): Promise<Result<Session>>;
}
```

### IGitService
Interface for git operations.

```typescript
interface IGitService {
  getIsDirty(): Promise<Result<boolean>>;
  getDirtyData(): Promise<Result<GitStatus>>;
  getStatus(): Promise<Result<GitStatus>>;
  createStash(message?: string): Promise<Result<GitStashResult>>;
  applyStash(stashName: string): Promise<Result<GitStashApplyResult>>;
  listStashes(): Promise<Result<GitStash[]>>;
  deleteStash(stashName: string): Promise<Result<boolean>>;
  isGitRepository(): Promise<Result<boolean>>;
  getCurrentBranch(): Promise<Result<string>>;
  getCurrentCommit(): Promise<Result<string>>;
  commitChanges(message: string): Promise<Result<boolean>>;
  isGitConfigured(): Promise<Result<boolean>>;
  getRepositoryRoot(): Promise<Result<string>>;
}
```

### IIDEService
Interface for IDE operations.

```typescript
interface IIDEService {
  openIDE(ideName: string, projectRoot: string): Promise<Result<boolean>>;
  openFiles(request: FileOpenRequest): Promise<Result<boolean>>;
  getAvailableIDEs(): Promise<Result<IDE[]>>;
  isIDEInstalled(ideName: string): Promise<Result<boolean>>;
}
```

### ILoggerService
Interface for logging operations.

```typescript
interface ILoggerService {
  log(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
  plainLog(message: string, meta?: Record<string, unknown>): void;
}
```

### ITerminalService
Interface for terminal operations.

```typescript
interface ITerminalService {
  execute(command: string, options?: TerminalOptions): Promise<Result<TerminalResult>>;
  executeCommand(command: TerminalCommand): Promise<Result<TerminalResult>>;
  executeBatch(commands: TerminalCommand[]): Promise<Result<TerminalResult[]>>;
  spawnTerminal(command: string, options?: TerminalOptions): Promise<Result<boolean>>;
  spawnTerminalCommand(command: TerminalCommand): Promise<Result<boolean>>;
  isCommandAvailable(command: string): Promise<Result<boolean>>;
  getShell(): Promise<Result<string>>;
}
```

---

## Use Case Classes

### Configuration Use Cases
- `GetConfig` - Retrieve current configuration
- `UpdateConfig` - Update configuration partially
- `ResetConfig` - Reset configuration to defaults
- `ExportConfig` - Export configuration as JSON
- `ImportConfig` - Import configuration from JSON

### Script Use Cases
- `CreateScript` - Create a single script
- `CreateScripts` - Create multiple scripts
- `GetScripts` - Get all scripts
- `GetScriptsByRootPath` - Get scripts by root path
- `UpdateScript` - Update a script
- `DeleteScript` - Delete a script
- `DeleteScriptsByRootPath` - Delete scripts by root path
- `ExportScripts` - Export scripts as JSON
- `ImportScripts` - Import scripts from JSON

### Session Use Cases
- `SaveSession` - Save a new session
- `UpdateSession` - Update an existing session
- `ResumeSession` - Resume a session
- `ListSessions` - List sessions with optional filtering
- `DeleteSession` - Delete a session

### Git Use Cases
- `GetGitStatus` - Get current git status
- `GetIsDirty` - Check if repository is dirty
- `GetDirtyData` - Get detailed dirty state information
- `CreateStash` - Create a git stash
- `ApplyStash` - Apply a git stash
- `ListStashes` - List all stashes
- `DeleteStash` - Delete a stash
- `GetCurrentCommit` - Get current commit hash
- `CommitChanges` - Commit changes with message

### IDE Use Cases
- `OpenIDE` - Open an IDE for a project
- `OpenFiles` - Open specific files in an IDE
- `GetAvailableIDEs` - Get list of available IDEs

---

## Git Types

### GitStatus
Represents the current status of a git repository.

```typescript
interface GitStatus {
  isDirty: boolean;
  dirtyFiles: GitFile[];
  newFiles: GitFile[];
  modifiedFiles: GitFile[];
  deletedFiles: GitFile[];
  untrackedFiles: GitFile[];
}
```

### GitFile
Represents a file in git status.

```typescript
interface GitFile {
  path: string;
  status: GitFileStatus;
  staged: boolean;
}
```

### GitFileStatus
Enum for git file statuses.

```typescript
enum GitFileStatus {
  MODIFIED = "modified",
  ADDED = "added",
  DELETED = "deleted",
  UNTRACKED = "untracked",
  RENAMED = "renamed",
  COPIED = "copied",
  UPDATED = "updated"
}
```

### GitStash
Represents a git stash.

```typescript
interface GitStash {
  id: string;
  name: string;
  message: string;
  timestamp: number;
  branch: string;
}
```

### GitStashResult
Result of a stash operation.

```typescript
interface GitStashResult {
  success: boolean;
  stashId?: string;
  error?: string;
}
```

### GitStashApplyResult
Result of applying a stash.

```typescript
interface GitStashApplyResult {
  success: boolean;
  conflicts?: string[];
  error?: string;
}
```

---

## IDE Types

### IDE
Represents an IDE configuration.

```typescript
interface IDE {
  name: string;
  command: string;
  args: string[];
  supportedPlatforms: string[];
}
```

### FileOpenRequest
Request to open files in an IDE.

```typescript
interface FileOpenRequest {
  ide: string;
  projectRoot: string;
  files: FileToOpen[];
}
```

### FileToOpen
Represents a file to be opened.

```typescript
interface FileToOpen {
  path: string;
  line?: number;
  column?: number;
  isActive?: boolean;
}
```

---

## Error Types

### ErrorCode
Enum for all error codes.

```typescript
enum ErrorCode {
  UNKNOWN = "UNKNOWN",
  CONFIG_INVALID = "CONFIG_INVALID",
  STORAGE_INVALID_PATH = "STORAGE_INVALID_PATH",
  STORAGE_DECRYPTION_FAILED = "STORAGE_DECRYPTION_FAILED",
  STORAGE_READ_FAILED = "STORAGE_READ_FAILED",
  STORAGE_WRITE_FAILED = "STORAGE_WRITE_FAILED",
  STORAGE_DELETE_FAILED = "STORAGE_DELETE_FAILED",
  ENCRYPTION_FAILED = "ENCRYPTION_FAILED",
  ENCRYPTION_INVALID_FORMAT = "ENCRYPTION_INVALID_FORMAT",
  SCRIPT_INVALID = "SCRIPT_INVALID",
  SCRIPT_DUPLICATE = "SCRIPT_DUPLICATE",
  SCRIPT_NOT_FOUND = "SCRIPT_NOT_FOUND",
  SCRIPT_PATH_INVALID = "SCRIPT_PATH_INVALID",
  SCRIPT_MALICIOUS = "SCRIPT_MALICIOUS",
  GIT_NOT_REPOSITORY = "GIT_NOT_REPOSITORY",
  GIT_COMMAND_FAILED = "GIT_COMMAND_FAILED",
  GIT_STASH_NOT_FOUND = "GIT_STASH_NOT_FOUND",
  GIT_STASH_CONFLICT = "GIT_STASH_CONFLICT",
  TERMINAL_COMMAND_FAILED = "TERMINAL_COMMAND_FAILED",
  TERMINAL_TIMEOUT = "TERMINAL_TIMEOUT",
  TERMINAL_COMMAND_NOT_FOUND = "TERMINAL_COMMAND_NOT_FOUND"
}
```

### StandardizedErrorShape
Standard shape for all errors.

```typescript
interface StandardizedErrorShape {
  code: ErrorCode;
  name: string;
  message: string;
  meta?: Record<string, unknown>;
}
```

### Error Classes
- `AppError` - Base error class
- `ConfigError` - Configuration-related errors
- `StorageError` - Storage-related errors
- `EncryptionError` - Encryption-related errors
- `ScriptError` - Script-related errors
- `GitError` - Git-related errors
- `TerminalError` - Terminal-related errors

### ErrorRegistryEntry
Entry in the error registry.

```typescript
interface ErrorRegistryEntry {
  code: ErrorCode;
  userMessage: string;
  exitCode: number;
}
```

### Error Utility Functions
- `getUserMessageForErrorCode(code: ErrorCode): string`
- `getExitCodeForErrorCode(code: ErrorCode): number`

---

## Logger Types

### CLILoggerFacade
CLI-specific logger facade.

```typescript
class CLILoggerFacade {
  log(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  plainLog(message: string, meta?: Record<string, unknown>): void;
}
```

---

## Terminal Types

### TerminalCommand
Represents a terminal command to execute.

```typescript
interface TerminalCommand {
  command: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;
}
```

### TerminalResult
Result of a terminal command execution.

```typescript
interface TerminalResult {
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
  error?: string;
}
```

### TerminalOptions
Options for terminal operations.

```typescript
interface TerminalOptions {
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;
  shell?: string;
}
```

---

## Facade Classes

### TerminalFacade
Facade for terminal operations.

```typescript
class TerminalFacade implements ITerminalService {
  execute(command: string, options?: TerminalOptions): Promise<Result<TerminalResult>>;
  executeCommand(command: TerminalCommand): Promise<Result<TerminalResult>>;
  executeBatch(commands: TerminalCommand[]): Promise<Result<TerminalResult[]>>;
  spawnTerminal(command: string, options?: TerminalOptions): Promise<Result<boolean>>;
  spawnTerminalCommand(command: TerminalCommand): Promise<Result<boolean>>;
  isCommandAvailable(command: string): Promise<Result<boolean>>;
  getShell(): Promise<Result<string>>;
}
```

### IDEFacade
Facade for IDE operations.

```typescript
class IDEFacade implements IIDEService {
  openIDE(ideName: string, projectRoot: string): Promise<Result<boolean>>;
  openFiles(request: FileOpenRequest): Promise<Result<boolean>>;
  getAvailableIDEs(): Promise<Result<IDE[]>>;
  isIDEInstalled(ideName: string): Promise<Result<boolean>>;
}
```

### GitFacade
Facade for git operations.

```typescript
class GitFacade implements IGitService {
  getCurrentCommit(): Promise<Result<string>>;
  isGitConfigured(): Promise<Result<boolean>>;
  commitChanges(message: string): Promise<Result<boolean>>;
  getIsDirty(): Promise<Result<boolean>>;
  getDirtyData(): Promise<Result<GitStatus>>;
  getStatus(): Promise<Result<GitStatus>>;
  createStash(message?: string): Promise<Result<GitStashResult>>;
  applyStash(stashName: string): Promise<Result<GitStashApplyResult>>;
  listStashes(): Promise<Result<GitStash[]>>;
  deleteStash(stashName: string): Promise<Result<boolean>>;
  isGitRepository(): Promise<Result<boolean>>;
  getCurrentBranch(): Promise<Result<string>>;
  getRepositoryRoot(): Promise<Result<string>>;
}
```

---

## Exported Aliases

The following aliases are exported for convenience:

- `ConfigurableLogger` - Alias for `CLILoggerFacade`
- `GitService` - Alias for `GitFacade`
- `IDEService` - Alias for `IDEFacade`
- `Terminal` - Alias for `TerminalFacade`

---

## Usage Examples

### Basic Configuration
```typescript
import { Config, GetConfig, UpdateConfig } from 'codestate-core';

const getConfig = new GetConfig();
const result = await getConfig.execute();
if (isSuccess(result)) {
  const config: Config = result.value;
  // Use config...
}
```

### Working with Scripts
```typescript
import { Script, CreateScript, GetScripts } from 'codestate-core';

const script: Script = {
  name: "build",
  rootPath: "/path/to/project",
  script: "npm run build"
};

const createScript = new CreateScript();
await createScript.execute(script);
```

### Git Operations
```typescript
import { GitService, GetGitStatus } from 'codestate-core';

const gitService = new GitService();
const getStatus = new GetGitStatus(gitService);
const result = await getStatus.execute();
```

### Error Handling
```typescript
import { AppError, ErrorCode, getUserMessageForErrorCode } from 'codestate-core';

try {
  // Some operation
} catch (error) {
  if (error instanceof AppError) {
    const userMessage = getUserMessageForErrorCode(error.code);
    console.error(userMessage);
  }
}
``` 