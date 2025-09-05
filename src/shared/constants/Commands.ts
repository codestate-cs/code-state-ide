export const Commands = {
  // Core session management commands
  SAVE_SESSION: 'codestate.saveSession',
  RESUME_SESSION: 'codestate.resumeSession',
  UPDATE_SESSION: 'codestate.updateSession',
  LIST_SESSIONS: 'codestate.listSessions',
  DELETE_SESSION: 'codestate.deleteSession',
  EXPORT_SESSION: 'codestate.exportSession',
  
  // Terminal collection commands
  SAVE_TERMINAL_COLLECTION: 'codestate.saveTerminalCollection',
  UPDATE_TERMINAL_COLLECTION: 'codestate.updateTerminalCollection',
  
  // Configuration commands
  REFRESH_CONFIG: 'codestate.refreshConfig',
  EDIT_CONFIG: 'codestate.editConfig',
  
  // Additional commands for future use
  IMPORT_SESSION: 'codestate.importSession',
  CLEAR_ALL_SESSIONS: 'codestate.clearAllSessions',
  REFRESH_SESSIONS: 'codestate.refreshSessions',
  DEBUG_SESSIONS: 'codestate.debugSessions',
  
  // Webview commands
  OPEN_SESSION_MANAGER: 'codestate.openSessionManager',
  OPEN_SESSION_DETAILS: 'codestate.openSessionDetails',
} as const;

export type CommandId = typeof Commands[keyof typeof Commands]; 