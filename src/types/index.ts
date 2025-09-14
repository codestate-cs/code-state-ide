// Communication Types
export const VSCODE_TYPES = {
  // UI Handshake
  UI_READY: 'codestate.ui.ready',
  
  // Data Init Types
  SESSIONS_INIT: 'codestate.sessions.init',
  SESSIONS_INIT_RESPONSE: 'codestate.sessions.init.response',
  SCRIPTS_INIT: 'codestate.scripts.init',
  SCRIPTS_INIT_RESPONSE: 'codestate.scripts.init.response',
  TC_INIT: 'codestate.tc.init',
  TC_INIT_RESPONSE: 'codestate.tc.init.response',
  CONFIG_INIT: 'codestate.config.init',
  CONFIG_INIT_RESPONSE: 'codestate.config.init.response',
  
  
  // Session Types
  SESSION: {
    CREATE_INIT: 'codestate.sessions.create.init',
    CREATE_INIT_RESPONSE: 'codestate.sessions.create.init.response',
    CREATE: 'codestate.session.create',
    UPDATE: 'codestate.session.update',
    DELETE: 'codestate.session.delete',
    RESUME: 'codestate.session.resume',
    // Response types
    CREATE_RESPONSE: 'codestate.session.create.response',
    UPDATE_RESPONSE: 'codestate.session.update.response',
    DELETE_RESPONSE: 'codestate.session.delete.response',
    RESUME_RESPONSE: 'codestate.session.resume.response'
  },
  
  // Script Types
  SCRIPT: {
    CREATE: 'codestate.script.create',
    UPDATE: 'codestate.script.update',
    DELETE: 'codestate.script.delete',
    RESUME: 'codestate.script.resume',
    // Response types
    CREATE_RESPONSE: 'codestate.script.create.response',
    UPDATE_RESPONSE: 'codestate.script.update.response',
    DELETE_RESPONSE: 'codestate.script.delete.response',
    RESUME_RESPONSE: 'codestate.script.resume.response'
  },
  
  // Terminal Collection Types
  TERMINAL_COLLECTION: {
    CREATE: 'codestate.terminal-collection.create',
    UPDATE: 'codestate.terminal-collection.update',
    DELETE: 'codestate.terminal-collection.delete',
    RESUME: 'codestate.terminal-collection.resume',
    // Response types
    CREATE_RESPONSE: 'codestate.terminal-collection.create.response',
    UPDATE_RESPONSE: 'codestate.terminal-collection.update.response',
    DELETE_RESPONSE: 'codestate.terminal-collection.delete.response',
    RESUME_RESPONSE: 'codestate.terminal-collection.resume.response'
  },
  
  // Config Types
  CONFIG: {
    UPDATE: 'codestate.config.update',
    // Response types
    UPDATE_RESPONSE: 'codestate.config.update.response'
  }
};

// Response Status
export const RESPONSE_STATUS = {
  SUCCESS: 'success' as const,
  ERROR: 'error' as const
};

// Message Types
export interface MessageRequest<T = any> {
  type: string;
  payload: T;
  id: string;
}

export interface MessageResponse<T = any> {
  type: string;
  status: 'success' | 'error';
  payload?: T;
  id: string;
}

// Init Response Data
export interface InitResponseData {
  success: boolean;
  sessions?: any[];
  scripts?: any[];
  terminalCollections?: any[];
  error?: string;
}