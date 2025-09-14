import { useEffect } from 'preact/hooks';
import { useCodeStateStore } from '../store/codestateStore';
import type { DataProvider } from '../providers/DataProvider';

export function useDataLoader(provider: DataProvider) {
  const {
    sessions,
    scripts,
    terminalCollections,
    sessionsLoading,
    scriptsLoading,
    terminalCollectionsLoading,
    sessionsError,
    scriptsError,
    terminalCollectionsError,
    sessionsLoaded,
    scriptsLoaded,
    terminalCollectionsLoaded,
    setSessions,
    setScripts,
    setTerminalCollections,
    removeSession,
    updateSession,
    setCurrentProjectRoot,
    setSessionsLoading,
    setScriptsLoading,
    setTerminalCollectionsLoading,
    setSessionsError,
    setScriptsError,
    setTerminalCollectionsError,
    setSessionsLoaded,
    setScriptsLoaded,
    setTerminalCollectionsLoaded,
    closeCreateSessionDialog,
    displaySessionCreatedFeedback,
    needsData
  } = useCodeStateStore();


  // Initialize data loading
  const initializeSessions = () => {
    if (sessionsLoaded || sessionsLoading) return;
    setSessionsLoading(true);
    setSessionsError(null);
    provider.initializeSessions();
  };

  const initializeScripts = () => {
    if (scriptsLoaded || scriptsLoading) return;
    setScriptsLoading(true);
    setScriptsError(null);
    provider.initializeScripts();
  };

  const initializeTerminalCollections = () => {
    if (terminalCollectionsLoaded || terminalCollectionsLoading) return;
    setTerminalCollectionsLoading(true);
    setTerminalCollectionsError(null);
    provider.initializeTerminalCollections();
  };


  // Managers handle all data updates directly - no need for manual handlers

  // Auto-initialize data when needed
  useEffect(() => {
    if (needsData('sessions')) {
      initializeSessions();
    }
  }, [needsData('sessions')]);

  useEffect(() => {
    if (needsData('scripts')) {
      initializeScripts();
    }
  }, [needsData('scripts')]);

  useEffect(() => {
    if (needsData('terminalCollections')) {
      initializeTerminalCollections();
    }
  }, [needsData('terminalCollections')]);

  // Session event handlers are managed directly by SessionManager - no manual setup needed

  return {
    // Data
    sessions,
    scripts,
    terminalCollections,
    
    // Loading states
    sessionsLoading,
    scriptsLoading,
    terminalCollectionsLoading,
    
    // Error states
    sessionsError,
    scriptsError,
    terminalCollectionsError,
    
    // Loaded states
    sessionsLoaded,
    scriptsLoaded,
    terminalCollectionsLoaded,
    
    // Actions
    initializeSessions,
    initializeScripts,
    initializeTerminalCollections
  };
}