// Session types based on @codestate/core
export interface Session {
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
  terminalCommands?: TerminalCommandState[];
  terminalCollections?: string[];
  scripts?: string[];
}

export interface SessionWithFullData extends Session {
  terminalCollectionsData?: TerminalCollectionWithScripts[];
  scriptsData?: Script[];
}

export interface FileState {
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
  position?: number;
}

export interface GitState {
  branch: string;
  commit: string;
  isDirty: boolean;
  stashId?: string | null;
}

export interface TerminalCommandState {
  terminalId: number;
  terminalName?: string;
  commands: SessionTerminalCommand[];
}

export interface SessionTerminalCommand {
  command: string;
  name: string;
  priority: number;
}

export interface TerminalCollectionWithScripts {
  id: string;
  name: string;
  rootPath: string;
  lifecycle: LifecycleEvent[];
  scripts: Script[];
  scriptReferences: { id: string, rootPath: string }[];
  closeTerminalAfterExecution?: boolean;
}

export interface Script {
  id: string;
  name: string;
  rootPath: string;
  script?: string;
  commands?: ScriptCommand[];
  lifecycle?: LifecycleEvent[];
  executionMode?: "same-terminal" | "new-terminals";
  closeTerminalAfterExecution?: boolean;
}

export interface ScriptCommand {
  command: string;
  name: string;
  priority: number;
}

export type LifecycleEvent = "open" | "resume" | "none";

// UI-specific types
export interface SessionCardProps {
  session: SessionWithFullData;
  isNewlyCreated?: boolean;
}

export interface SessionListProps {
  sessions: SessionWithFullData[];
  isLoading: boolean;
  onEvent: (event: import('../store/codestateStore').UIEvent) => void;
}