import { create } from 'zustand';
import type { SessionWithFullData, Script, TerminalCollectionWithScripts } from '../types/session';

// Event types for delegation
export type UIEvent = 
  | { type: 'CREATE_SESSION'; payload?: any }
  | { type: 'RESUME_SESSION'; payload: { id: string } }
  | { type: 'DELETE_SESSION'; payload: { id: string } }
  | { type: 'EXPORT_SESSION'; payload: { id: string } }
  | { type: 'EDIT_SESSION'; payload: { id: string } }
  | { type: 'CREATE_SCRIPT'; payload?: any }
  | { type: 'RUN_SCRIPT'; payload: { id: string } }
  | { type: 'DELETE_SCRIPT'; payload: { id: string } }
  | { type: 'EDIT_SCRIPT'; payload: { id: string } }
  | { type: 'CREATE_TERMINAL_COLLECTION'; payload?: any }
  | { type: 'EXECUTE_TERMINAL_COLLECTION'; payload: { id: string } }
  | { type: 'DELETE_TERMINAL_COLLECTION'; payload: { id: string } }
  | { type: 'EDIT_TERMINAL_COLLECTION'; payload: { id: string } };

// Response event types
export type UIResponseEvent = 
  | { type: 'CREATE_SESSION_RESPONSE'; payload: { success: boolean; id?: string; error?: string } }
  | { type: 'RESUME_SESSION_RESPONSE'; payload: { success: boolean; session?: any; error?: string } }
  | { type: 'DELETE_SESSION_RESPONSE'; payload: { success: boolean; id?: string; error?: string } }
  | { type: 'UPDATE_SESSION_RESPONSE'; payload: { success: boolean; session?: any; error?: string } }
  | { type: 'EXPORT_SESSION_RESPONSE'; payload: { success: boolean; sessionId?: string; exportPath?: string; error?: string } };

interface CodeStateStore {
  // Data state
  sessions: SessionWithFullData[];
  scripts: Script[];
  terminalCollections: TerminalCollectionWithScripts[];
  
  // Current project state
  currentProjectRoot: string | null;
  
  // Loading states
  sessionsLoading: boolean;
  scriptsLoading: boolean;
  terminalCollectionsLoading: boolean;
  
  // Error states
  sessionsError: string | null;
  scriptsError: string | null;
  terminalCollectionsError: string | null;
  
  // Data loaded flags
  sessionsLoaded: boolean;
  scriptsLoaded: boolean;
  terminalCollectionsLoaded: boolean;
  
  // UI State
  createSessionDialog: {
    isOpen: boolean;
    sessionData: any | null;
    sessionDataError: string | null;
  };
  
  createScriptDialog: {
    isOpen: boolean;
    rootPath: string | null;
  };
  
  createTerminalCollectionDialog: {
    isOpen: boolean;
    rootPath: string | null;
  };
  
  configDialog: {
    isOpen: boolean;
    configData: any | null;
    configDataError: string | null;
  };
  
  // Temp session data for pending creation
  tempSessionData: SessionWithFullData | null;
  
  // Temp script data for pending creation
  tempScriptData: Script | null;
  
  // Temp terminal collection data for pending creation
  tempTerminalCollectionData: TerminalCollectionWithScripts | null;
  
  // Session popup state
  currentSession: SessionWithFullData | null;
  isEditDialogOpen: boolean;
  isDeleteDialogOpen: boolean;
  
  // Script popup state
  currentScript: Script | null;
  isScriptDeleteDialogOpen: boolean;
  isScriptEditDialogOpen: boolean;
  
  // Terminal collection popup state
  currentTerminalCollection: TerminalCollectionWithScripts | null;
  isTerminalCollectionDeleteDialogOpen: boolean;
  isTerminalCollectionEditDialogOpen: boolean;
  
  // Session creation feedback
  newlyCreatedSessionId: string | null;
  showSessionCreatedFeedback: boolean;
  
  // Script creation feedback
  newlyCreatedScriptId: string | null;
  showScriptCreatedFeedback: boolean;
  
  // Terminal collection creation feedback
  newlyCreatedTerminalCollectionId: string | null;
  showTerminalCollectionCreatedFeedback: boolean;
  
  // Actions
  setSessions: (sessions: SessionWithFullData[]) => void;
  setScripts: (scripts: Script[]) => void;
  setTerminalCollections: (terminalCollections: TerminalCollectionWithScripts[]) => void;
  addSession: (session: SessionWithFullData) => void;
  removeSession: (sessionId: string) => void;
  updateSession: (session: SessionWithFullData) => void;
  
  addScript: (script: Script) => void;
  removeScript: (scriptId: string) => void;
  updateScript: (script: Script) => void;
  
  addTerminalCollection: (terminalCollection: TerminalCollectionWithScripts) => void;
  removeTerminalCollection: (terminalCollectionId: string) => void;
  updateTerminalCollection: (terminalCollection: TerminalCollectionWithScripts) => void;
  setCurrentProjectRoot: (rootPath: string | null) => void;
  
  setSessionsLoading: (loading: boolean) => void;
  setScriptsLoading: (loading: boolean) => void;
  setTerminalCollectionsLoading: (loading: boolean) => void;
  
  setSessionsError: (error: string | null) => void;
  setScriptsError: (error: string | null) => void;
  setTerminalCollectionsError: (error: string | null) => void;
  
  setSessionsLoaded: (loaded: boolean) => void;
  setScriptsLoaded: (loaded: boolean) => void;
  setTerminalCollectionsLoaded: (loaded: boolean) => void;
  
  // UI Actions
  setCreateSessionDialog: (state: Partial<CodeStateStore['createSessionDialog']>) => void;
  openCreateSessionDialog: () => void;
  closeCreateSessionDialog: () => void;
  setSessionData: (data: any | null) => void;
  setSessionDataError: (error: string | null) => void;
  
  setCreateScriptDialog: (state: Partial<CodeStateStore['createScriptDialog']>) => void;
  openCreateScriptDialog: (rootPath?: string) => void;
  closeCreateScriptDialog: () => void;
  
  setCreateTerminalCollectionDialog: (state: Partial<CodeStateStore['createTerminalCollectionDialog']>) => void;
  openCreateTerminalCollectionDialog: (rootPath?: string) => void;
  closeCreateTerminalCollectionDialog: () => void;
  
  setConfigDialog: (state: Partial<CodeStateStore['configDialog']>) => void;
  openConfigDialog: () => void;
  closeConfigDialog: () => void;
  setConfigData: (data: any | null) => void;
  setConfigDataError: (error: string | null) => void;
  
  // Temp session actions
  setTempSessionData: (sessionData: SessionWithFullData | null) => void;
  addTempSessionWithId: (sessionId: string) => void;
  
  // Temp script actions
  setTempScriptData: (scriptData: Script | null) => void;
  addTempScriptWithId: (scriptId: string) => void;
  
  // Temp terminal collection actions
  setTempTerminalCollectionData: (terminalCollectionData: TerminalCollectionWithScripts | null) => void;
  addTempTerminalCollectionWithId: (terminalCollectionId: string) => void;
  
  // Session popup actions
  setCurrentSession: (session: SessionWithFullData | null) => void;
  openEditDialog: (session: SessionWithFullData) => void;
  openDeleteDialog: (session: SessionWithFullData) => void;
  closeAllDialogs: () => void;
  
  // Script popup actions
  setCurrentScript: (script: Script | null) => void;
  openScriptDeleteDialog: (script: Script) => void;
  openScriptEditDialog: (script: Script) => void;
  
  // Terminal collection popup actions
  setCurrentTerminalCollection: (terminalCollection: TerminalCollectionWithScripts | null) => void;
  openTerminalCollectionDeleteDialog: (terminalCollection: TerminalCollectionWithScripts) => void;
  openTerminalCollectionEditDialog: (terminalCollection: TerminalCollectionWithScripts) => void;
  
  // Session creation feedback actions
  setNewlyCreatedSessionId: (sessionId: string | null) => void;
  displaySessionCreatedFeedback: (sessionId: string) => void;
  hideSessionCreatedFeedback: () => void;
  
  // Script creation feedback actions
  setNewlyCreatedScriptId: (scriptId: string | null) => void;
  displayScriptCreatedFeedback: (scriptId: string) => void;
  
  // Terminal collection creation feedback actions
  setNewlyCreatedTerminalCollectionId: (terminalCollectionId: string | null) => void;
  displayTerminalCollectionCreatedFeedback: (terminalCollectionId: string) => void;
  hideTerminalCollectionCreatedFeedback: () => void;
  hideScriptCreatedFeedback: () => void;
  
  // Event handling
  dispatchEvent: (event: UIEvent) => void;
  
  // Helper methods
  isLoading: (type: 'sessions' | 'scripts' | 'terminalCollections') => boolean;
  hasError: (type: 'sessions' | 'scripts' | 'terminalCollections') => boolean;
  isLoaded: (type: 'sessions' | 'scripts' | 'terminalCollections') => boolean;
  needsData: (type: 'sessions' | 'scripts' | 'terminalCollections') => boolean;
}

export const useCodeStateStore = create<CodeStateStore>((set, get) => ({
  // Initial state
  sessions: [],
  scripts: [],
  terminalCollections: [],
  currentProjectRoot: null,
  
  sessionsLoading: false,
  scriptsLoading: false,
  terminalCollectionsLoading: false,
  
  sessionsError: null,
  scriptsError: null,
  terminalCollectionsError: null,
  
  sessionsLoaded: false,
  scriptsLoaded: false,
  terminalCollectionsLoaded: false,
  
  // UI State
  createSessionDialog: {
    isOpen: false,
    sessionData: null,
    sessionDataError: null,
  },
  
  createScriptDialog: {
    isOpen: false,
    rootPath: null,
  },
  
  createTerminalCollectionDialog: {
    isOpen: false,
    rootPath: null,
  },
  
  configDialog: {
    isOpen: false,
    configData: null,
    configDataError: null,
  },
  
  // Temp session data for pending creation
  tempSessionData: null,
  
  // Temp script data for pending creation
  tempScriptData: null,
  
  // Temp terminal collection data for pending creation
  tempTerminalCollectionData: null,
  
  // Session popup state
  currentSession: null,
  isEditDialogOpen: false,
  isDeleteDialogOpen: false,
  
  // Script popup state
  currentScript: null,
  isScriptDeleteDialogOpen: false,
  isScriptEditDialogOpen: false,
  
  // Terminal collection popup state
  currentTerminalCollection: null,
  isTerminalCollectionDeleteDialogOpen: false,
  isTerminalCollectionEditDialogOpen: false,
  
  // Session creation feedback
  newlyCreatedSessionId: null,
  showSessionCreatedFeedback: false,
  
  // Script creation feedback
  newlyCreatedScriptId: null,
  showScriptCreatedFeedback: false,
  
  // Terminal collection creation feedback
  newlyCreatedTerminalCollectionId: null,
  showTerminalCollectionCreatedFeedback: false,
  
  // Actions
  setSessions: (sessions) => {
    console.log('Zustand: setSessions called with:', sessions);
    set({ sessions });
  },
  setScripts: (scripts) => set({ scripts }),
  setTerminalCollections: (terminalCollections) => set({ terminalCollections }),
  addSession: (session) => set((state) => ({ sessions: [...state.sessions, session] })),
  removeSession: (sessionId) => set((state) => ({ 
    sessions: state.sessions.filter(s => s.id !== sessionId) 
  })),
  updateSession: (session) => set((state) => ({
    sessions: state.sessions.map(s => s.id === session.id ? session : s)
  })),
  
  addScript: (script) => set((state) => ({ scripts: [...state.scripts, script] })),
  removeScript: (scriptId) => set((state) => ({ 
    scripts: state.scripts.filter(s => s.id !== scriptId) 
  })),
  updateScript: (script) => set((state) => {
    console.log('Zustand: updateScript called with:', script);
    console.log('Zustand: Current scripts:', state.scripts);
    const updatedScripts = state.scripts.map(s => s.id === script.id ? script : s);
    console.log('Zustand: Updated scripts:', updatedScripts);
    return { scripts: updatedScripts };
  }),
  
  addTerminalCollection: (terminalCollection) => set((state) => ({ 
    terminalCollections: [...state.terminalCollections, terminalCollection] 
  })),
  removeTerminalCollection: (terminalCollectionId) => set((state) => ({ 
    terminalCollections: state.terminalCollections.filter(tc => tc.id !== terminalCollectionId) 
  })),
  updateTerminalCollection: (terminalCollection) => set((state) => {
    console.log('Zustand: updateTerminalCollection called with:', terminalCollection);
    console.log('Zustand: Current terminal collections:', state.terminalCollections);
    const updatedTerminalCollections = state.terminalCollections.map(tc => tc.id === terminalCollection.id ? terminalCollection : tc);
    console.log('Zustand: Updated terminal collections:', updatedTerminalCollections);
    return { terminalCollections: updatedTerminalCollections };
  }),
  setCurrentProjectRoot: (rootPath) => {
    console.log('Zustand: setCurrentProjectRoot called with:', rootPath);
    set({ currentProjectRoot: rootPath });
  },
  
  setSessionsLoading: (loading) => set({ sessionsLoading: loading }),
  setScriptsLoading: (loading) => set({ scriptsLoading: loading }),
  setTerminalCollectionsLoading: (loading) => set({ terminalCollectionsLoading: loading }),
  
  setSessionsError: (error) => set({ sessionsError: error }),
  setScriptsError: (error) => set({ scriptsError: error }),
  setTerminalCollectionsError: (error) => set({ terminalCollectionsError: error }),
  
  setSessionsLoaded: (loaded) => set({ sessionsLoaded: loaded }),
  setScriptsLoaded: (loaded) => set({ scriptsLoaded: loaded }),
  setTerminalCollectionsLoaded: (loaded) => set({ terminalCollectionsLoaded: loaded }),
  
  // UI Actions
  setCreateSessionDialog: (state) => set((prev) => ({
    createSessionDialog: { ...prev.createSessionDialog, ...state }
  })),
  
  openCreateSessionDialog: () => set((prev) => ({
    createSessionDialog: { ...prev.createSessionDialog, isOpen: true }
  })),
  
  closeCreateSessionDialog: () => set((prev) => ({
    createSessionDialog: { ...prev.createSessionDialog, isOpen: false, sessionData: null, sessionDataError: null }
  })),
  
  setSessionData: (data) => set((prev) => ({
    createSessionDialog: { ...prev.createSessionDialog, sessionData: data, sessionDataError: null }
  })),
  
  setSessionDataError: (error) => set((prev) => ({
    createSessionDialog: { ...prev.createSessionDialog, sessionDataError: error, sessionData: null }
  })),
  
  // Script dialog actions
  setCreateScriptDialog: (state) => set((prev) => ({
    createScriptDialog: { ...prev.createScriptDialog, ...state }
  })),
  
  openCreateScriptDialog: (rootPath) => set((prev) => ({
    createScriptDialog: { ...prev.createScriptDialog, isOpen: true, rootPath: rootPath || null }
  })),
  
  closeCreateScriptDialog: () => set((prev) => ({
    createScriptDialog: { ...prev.createScriptDialog, isOpen: false, rootPath: null }
  })),
  
  // Terminal collection dialog actions
  setCreateTerminalCollectionDialog: (state) => set((prev) => ({
    createTerminalCollectionDialog: { ...prev.createTerminalCollectionDialog, ...state }
  })),
  
  openCreateTerminalCollectionDialog: (rootPath) => set((prev) => ({
    createTerminalCollectionDialog: { ...prev.createTerminalCollectionDialog, isOpen: true, rootPath: rootPath || null }
  })),
  
  closeCreateTerminalCollectionDialog: () => set((prev) => ({
    createTerminalCollectionDialog: { ...prev.createTerminalCollectionDialog, isOpen: false, rootPath: null }
  })),
  
  // Config dialog actions
  setConfigDialog: (state) => set((prev) => ({
    configDialog: { ...prev.configDialog, ...state }
  })),
  
  openConfigDialog: () => set((prev) => ({
    configDialog: { ...prev.configDialog, isOpen: true }
  })),
  
  closeConfigDialog: () => set((prev) => ({
    configDialog: { ...prev.configDialog, isOpen: false, configData: null, configDataError: null }
  })),
  
  setConfigData: (data) => {
    console.log('Store: setConfigData called with', data);
    set((prev) => ({
      configDialog: { ...prev.configDialog, configData: data, configDataError: null }
    }));
  },
  
  setConfigDataError: (error) => {
    console.log('Store: setConfigDataError called with', error);
    set((prev) => ({
      configDialog: { ...prev.configDialog, configDataError: error, configData: null }
    }));
  },
  
  // Temp session actions
  setTempSessionData: (sessionData) => set({ tempSessionData: sessionData }),
  
  addTempSessionWithId: (sessionId) => set((state) => {
    if (state.tempSessionData) {
      const sessionWithId = { ...state.tempSessionData, id: sessionId };
      return {
        sessions: [...state.sessions, sessionWithId],
        tempSessionData: null
      };
    }
    return state;
  }),
  
  // Temp script actions
  setTempScriptData: (scriptData) => set({ tempScriptData: scriptData }),
  
  addTempScriptWithId: (scriptId) => set((state) => {
    if (state.tempScriptData) {
      const scriptWithId = { ...state.tempScriptData, id: scriptId };
      return {
        scripts: [...state.scripts, scriptWithId],
        tempScriptData: null
      };
    }
    return state;
  }),
  
  // Temp terminal collection actions
  setTempTerminalCollectionData: (terminalCollectionData) => set({ tempTerminalCollectionData: terminalCollectionData }),
  
  addTempTerminalCollectionWithId: (terminalCollectionId) => set((state) => {
    if (state.tempTerminalCollectionData) {
      const terminalCollectionWithId = { ...state.tempTerminalCollectionData, id: terminalCollectionId };
      return {
        terminalCollections: [...state.terminalCollections, terminalCollectionWithId],
        tempTerminalCollectionData: null
      };
    }
    return state;
  }),
  
  // Session popup actions
  setCurrentSession: (session) => set({ currentSession: session }),
  
  openEditDialog: (session) => set({ 
    currentSession: session, 
    isEditDialogOpen: true,
    isDeleteDialogOpen: false 
  }),
  
  openDeleteDialog: (session) => set({ 
    currentSession: session, 
    isDeleteDialogOpen: true,
    isEditDialogOpen: false 
  }),
  
  closeAllDialogs: () => set({ 
    isEditDialogOpen: false, 
    isDeleteDialogOpen: false,
    isScriptDeleteDialogOpen: false,
    isScriptEditDialogOpen: false,
    isTerminalCollectionDeleteDialogOpen: false,
    isTerminalCollectionEditDialogOpen: false,
    currentSession: null,
    currentScript: null,
    currentTerminalCollection: null
  }),
  
  // Script popup actions
  setCurrentScript: (script) => set({ currentScript: script }),
  
  openScriptDeleteDialog: (script) => set({ 
    currentScript: script, 
    isScriptDeleteDialogOpen: true
  }),
  
  openScriptEditDialog: (script) => set({ 
    currentScript: script, 
    isScriptEditDialogOpen: true
  }),
  
  // Terminal collection popup actions
  setCurrentTerminalCollection: (terminalCollection) => set({ currentTerminalCollection: terminalCollection }),
  
  openTerminalCollectionDeleteDialog: (terminalCollection) => set({ 
    currentTerminalCollection: terminalCollection, 
    isTerminalCollectionDeleteDialogOpen: true
  }),
  
  openTerminalCollectionEditDialog: (terminalCollection) => set({ 
    currentTerminalCollection: terminalCollection, 
    isTerminalCollectionEditDialogOpen: true
  }),
  
  // Session creation feedback actions
  setNewlyCreatedSessionId: (sessionId) => set({ newlyCreatedSessionId: sessionId }),
  
  displaySessionCreatedFeedback: (sessionId) => set({ 
    newlyCreatedSessionId: sessionId, 
    showSessionCreatedFeedback: true 
  }),
  
  hideSessionCreatedFeedback: () => set({ 
    newlyCreatedSessionId: null, 
    showSessionCreatedFeedback: false 
  }),
  
  // Script creation feedback actions
  setNewlyCreatedScriptId: (scriptId) => set({ newlyCreatedScriptId: scriptId }),
  
  displayScriptCreatedFeedback: (scriptId) => set({ 
    newlyCreatedScriptId: scriptId, 
    showScriptCreatedFeedback: true 
  }),
  
  hideScriptCreatedFeedback: () => set({ 
    newlyCreatedScriptId: null, 
    showScriptCreatedFeedback: false 
  }),
  
  // Terminal collection creation feedback actions
  setNewlyCreatedTerminalCollectionId: (terminalCollectionId) => set({ newlyCreatedTerminalCollectionId: terminalCollectionId }),
  
  displayTerminalCollectionCreatedFeedback: (terminalCollectionId) => set({ 
    newlyCreatedTerminalCollectionId: terminalCollectionId, 
    showTerminalCollectionCreatedFeedback: true 
  }),
  
  hideTerminalCollectionCreatedFeedback: () => set({ 
    newlyCreatedTerminalCollectionId: null, 
    showTerminalCollectionCreatedFeedback: false 
  }),
  
  // Event handling
  dispatchEvent: (event) => {
    console.log('Dispatching UI event:', event);
    // This will be handled by components that listen to specific events
    // For now, we'll just log it. Components can subscribe to store changes
  },
  
  // Helper methods
  isLoading: (type) => {
    const state = get();
    switch (type) {
      case 'sessions': return state.sessionsLoading;
      case 'scripts': return state.scriptsLoading;
      case 'terminalCollections': return state.terminalCollectionsLoading;
    }
  },
  
  hasError: (type) => {
    const state = get();
    switch (type) {
      case 'sessions': return !!state.sessionsError;
      case 'scripts': return !!state.scriptsError;
      case 'terminalCollections': return !!state.terminalCollectionsError;
    }
  },
  
  isLoaded: (type) => {
    const state = get();
    switch (type) {
      case 'sessions': return state.sessionsLoaded;
      case 'scripts': return state.scriptsLoaded;
      case 'terminalCollections': return state.terminalCollectionsLoaded;
    }
  },
  
  needsData: (type) => {
    const state = get();
    switch (type) {
      case 'sessions': return !state.sessionsLoaded && !state.sessionsLoading;
      case 'scripts': return !state.scriptsLoaded && !state.scriptsLoading;
      case 'terminalCollections': return !state.terminalCollectionsLoaded && !state.terminalCollectionsLoading;
    }
  }
}));