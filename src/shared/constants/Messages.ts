export const Messages = {
  // Configuration messages
  CONFIG_SAVED: 'Configuration saved successfully',
  CONFIG_LOADED: 'Configuration loaded successfully',
  CONFIG_REFRESHED: 'Configuration refreshed successfully',
  
  // Session messages
  SESSION_SAVED: 'Session "{name}" saved successfully',
  SESSION_RESUMED: 'Session "{name}" resumed successfully',
  SESSION_DELETED: 'Session "{name}" deleted successfully',
  SESSION_NOT_FOUND: 'Session "{name}" not found',
  WORKSPACE_REQUIRED: 'Please open a workspace to use CodeState',
  SAVE_PROMPT: 'Enter session name:',
  RESUME_PROMPT: 'Select session to resume:',
  SAVING_SESSION: 'Saving session...',
  RESUMING_SESSION: 'Resuming session...',
  
  // Error messages
  CONFIG_SAVE_FAILED: 'Failed to save configuration',
  CONFIG_LOAD_FAILED: 'Failed to load configuration',
  CONFIG_REFRESH_FAILED: 'Failed to refresh configuration',
  INVALID_CONFIG: 'Invalid configuration',
  
  // Progress messages
  SAVING_CONFIG: 'Saving configuration...',
  LOADING_CONFIG: 'Loading configuration...',
  REFRESHING_CONFIG: 'Refreshing configuration...',
} as const;

export type MessageKey = keyof typeof Messages; 