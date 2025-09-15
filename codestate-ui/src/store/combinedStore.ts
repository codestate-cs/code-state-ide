// Combined store for backward compatibility
// This provides the same interface as the original codestateStore
// but uses the individual domain stores under the hood

import { useSessionStore } from './sessionStore';
import { useScriptStore } from './scriptStore';
import { useTerminalCollectionStore } from './terminalCollectionStore';
import { useConfigStore } from './configStore';

// Re-export all the individual stores
export { useSessionStore, useScriptStore, useTerminalCollectionStore, useConfigStore };

// Combined store hook for backward compatibility
export const useCodeStateStore = () => {
  const sessionStore = useSessionStore();
  const scriptStore = useScriptStore();
  const terminalCollectionStore = useTerminalCollectionStore();
  const configStore = useConfigStore();

  return {
    // Session data
    sessions: sessionStore.sessions,
    sessionsLoading: sessionStore.sessionsLoading,
    sessionsError: sessionStore.sessionsError,
    sessionsLoaded: sessionStore.sessionsLoaded,
    createSessionDialog: sessionStore.createSessionDialog,
    tempSessionData: sessionStore.tempSessionData,
    currentSession: sessionStore.currentSession,
    isEditDialogOpen: sessionStore.isEditDialogOpen,
    isDeleteDialogOpen: sessionStore.isDeleteDialogOpen,
    newlyCreatedSessionId: sessionStore.newlyCreatedSessionId,
    showSessionCreatedFeedback: sessionStore.showSessionCreatedFeedback,

    // Script data
    scripts: scriptStore.scripts,
    scriptsLoading: scriptStore.scriptsLoading,
    scriptsError: scriptStore.scriptsError,
    scriptsLoaded: scriptStore.scriptsLoaded,
    createScriptDialog: scriptStore.createScriptDialog,
    tempScriptData: scriptStore.tempScriptData,
    currentScript: scriptStore.currentScript,
    isScriptDeleteDialogOpen: scriptStore.isScriptDeleteDialogOpen,
    isScriptEditDialogOpen: scriptStore.isScriptEditDialogOpen,
    newlyCreatedScriptId: scriptStore.newlyCreatedScriptId,
    showScriptCreatedFeedback: scriptStore.showScriptCreatedFeedback,

    // Terminal collection data
    terminalCollections: terminalCollectionStore.terminalCollections,
    terminalCollectionsLoading: terminalCollectionStore.terminalCollectionsLoading,
    terminalCollectionsError: terminalCollectionStore.terminalCollectionsError,
    terminalCollectionsLoaded: terminalCollectionStore.terminalCollectionsLoaded,
    createTerminalCollectionDialog: terminalCollectionStore.createTerminalCollectionDialog,
    tempTerminalCollectionData: terminalCollectionStore.tempTerminalCollectionData,
    currentTerminalCollection: terminalCollectionStore.currentTerminalCollection,
    isTerminalCollectionDeleteDialogOpen: terminalCollectionStore.isTerminalCollectionDeleteDialogOpen,
    isTerminalCollectionEditDialogOpen: terminalCollectionStore.isTerminalCollectionEditDialogOpen,
    newlyCreatedTerminalCollectionId: terminalCollectionStore.newlyCreatedTerminalCollectionId,
    showTerminalCollectionCreatedFeedback: terminalCollectionStore.showTerminalCollectionCreatedFeedback,

    // Config data
    currentProjectRoot: configStore.currentProjectRoot,
    configDialog: configStore.configDialog,

    // Session actions
    setSessions: sessionStore.setSessions,
    addSession: sessionStore.addSession,
    removeSession: sessionStore.removeSession,
    updateSession: sessionStore.updateSession,
    setSessionsLoading: sessionStore.setSessionsLoading,
    setSessionsError: sessionStore.setSessionsError,
    setSessionsLoaded: sessionStore.setSessionsLoaded,
    setCreateSessionDialog: sessionStore.setCreateSessionDialog,
    openCreateSessionDialog: sessionStore.openCreateSessionDialog,
    closeCreateSessionDialog: sessionStore.closeCreateSessionDialog,
    setSessionData: sessionStore.setSessionData,
    setSessionDataError: sessionStore.setSessionDataError,
    setTempSessionData: sessionStore.setTempSessionData,
    addTempSessionWithId: sessionStore.addTempSessionWithId,
    setCurrentSession: sessionStore.setCurrentSession,
    openEditDialog: sessionStore.openEditDialog,
    closeEditDialog: sessionStore.closeEditDialog,
    openDeleteDialog: sessionStore.openDeleteDialog,
    setNewlyCreatedSessionId: sessionStore.setNewlyCreatedSessionId,
    displaySessionCreatedFeedback: sessionStore.displaySessionCreatedFeedback,
    hideSessionCreatedFeedback: sessionStore.hideSessionCreatedFeedback,

    // Script actions
    setScripts: scriptStore.setScripts,
    addScript: scriptStore.addScript,
    removeScript: scriptStore.removeScript,
    updateScript: scriptStore.updateScript,
    setScriptsLoading: scriptStore.setScriptsLoading,
    setScriptsError: scriptStore.setScriptsError,
    setScriptsLoaded: scriptStore.setScriptsLoaded,
    setCreateScriptDialog: scriptStore.setCreateScriptDialog,
    openCreateScriptDialog: scriptStore.openCreateScriptDialog,
    closeCreateScriptDialog: scriptStore.closeCreateScriptDialog,
    setTempScriptData: scriptStore.setTempScriptData,
    addTempScriptWithId: scriptStore.addTempScriptWithId,
    setCurrentScript: scriptStore.setCurrentScript,
    openScriptDeleteDialog: scriptStore.openScriptDeleteDialog,
    openScriptEditDialog: scriptStore.openScriptEditDialog,
    closeScriptEditDialog: scriptStore.closeScriptEditDialog,
    setNewlyCreatedScriptId: scriptStore.setNewlyCreatedScriptId,
    displayScriptCreatedFeedback: scriptStore.displayScriptCreatedFeedback,
    hideScriptCreatedFeedback: scriptStore.hideScriptCreatedFeedback,

    // Terminal collection actions
    setTerminalCollections: terminalCollectionStore.setTerminalCollections,
    addTerminalCollection: terminalCollectionStore.addTerminalCollection,
    removeTerminalCollection: terminalCollectionStore.removeTerminalCollection,
    updateTerminalCollection: terminalCollectionStore.updateTerminalCollection,
    setTerminalCollectionsLoading: terminalCollectionStore.setTerminalCollectionsLoading,
    setTerminalCollectionsError: terminalCollectionStore.setTerminalCollectionsError,
    setTerminalCollectionsLoaded: terminalCollectionStore.setTerminalCollectionsLoaded,
    setCreateTerminalCollectionDialog: terminalCollectionStore.setCreateTerminalCollectionDialog,
    openCreateTerminalCollectionDialog: terminalCollectionStore.openCreateTerminalCollectionDialog,
    closeCreateTerminalCollectionDialog: terminalCollectionStore.closeCreateTerminalCollectionDialog,
    setTempTerminalCollectionData: terminalCollectionStore.setTempTerminalCollectionData,
    addTempTerminalCollectionWithId: terminalCollectionStore.addTempTerminalCollectionWithId,
    setCurrentTerminalCollection: terminalCollectionStore.setCurrentTerminalCollection,
    openTerminalCollectionDeleteDialog: terminalCollectionStore.openTerminalCollectionDeleteDialog,
    openTerminalCollectionEditDialog: terminalCollectionStore.openTerminalCollectionEditDialog,
    closeTerminalCollectionEditDialog: terminalCollectionStore.closeTerminalCollectionEditDialog,
    setNewlyCreatedTerminalCollectionId: terminalCollectionStore.setNewlyCreatedTerminalCollectionId,
    displayTerminalCollectionCreatedFeedback: terminalCollectionStore.displayTerminalCollectionCreatedFeedback,
    hideTerminalCollectionCreatedFeedback: terminalCollectionStore.hideTerminalCollectionCreatedFeedback,

    // Config actions
    setCurrentProjectRoot: configStore.setCurrentProjectRoot,
    setConfigDialog: configStore.setConfigDialog,
    openConfigDialog: configStore.openConfigDialog,
    closeConfigDialog: configStore.closeConfigDialog,
    setConfigData: configStore.setConfigData,
    setConfigDataError: configStore.setConfigDataError,

    // Combined actions
    closeAllDialogs: () => {
      sessionStore.closeCreateSessionDialog();
      scriptStore.closeCreateScriptDialog();
      terminalCollectionStore.closeCreateTerminalCollectionDialog();
      configStore.closeConfigDialog();
      // Close popup dialogs
      sessionStore.setCurrentSession(null);
      sessionStore.openEditDialog = () => {};
      sessionStore.openDeleteDialog = () => {};
      scriptStore.setCurrentScript(null);
      scriptStore.openScriptDeleteDialog = () => {};
      scriptStore.openScriptEditDialog = () => {};
      terminalCollectionStore.setCurrentTerminalCollection(null);
      terminalCollectionStore.openTerminalCollectionDeleteDialog = () => {};
      terminalCollectionStore.openTerminalCollectionEditDialog = () => {};
    },

    // Helper methods
    isLoading: (type: 'sessions' | 'scripts' | 'terminalCollections') => {
      switch (type) {
        case 'sessions': return sessionStore.isLoading();
        case 'scripts': return scriptStore.isLoading();
        case 'terminalCollections': return terminalCollectionStore.isLoading();
      }
    },
    
    hasError: (type: 'sessions' | 'scripts' | 'terminalCollections') => {
      switch (type) {
        case 'sessions': return sessionStore.hasError();
        case 'scripts': return scriptStore.hasError();
        case 'terminalCollections': return terminalCollectionStore.hasError();
      }
    },
    
    isLoaded: (type: 'sessions' | 'scripts' | 'terminalCollections') => {
      switch (type) {
        case 'sessions': return sessionStore.isLoaded();
        case 'scripts': return scriptStore.isLoaded();
        case 'terminalCollections': return terminalCollectionStore.isLoaded();
      }
    },
    
    needsData: (type: 'sessions' | 'scripts' | 'terminalCollections') => {
      switch (type) {
        case 'sessions': return sessionStore.needsData();
        case 'scripts': return scriptStore.needsData();
        case 'terminalCollections': return terminalCollectionStore.needsData();
      }
    },

    // Event handling (placeholder)
    dispatchEvent: (event: any) => {
      console.log('Dispatching UI event:', event);
    }
  };
};