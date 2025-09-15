import { useEffect } from 'preact/hooks';
import { useSessionStore, useScriptStore, useTerminalCollectionStore } from '../store/combinedStore';
import type { DataProvider } from '../providers/DataProvider';

export function useDataLoader(provider: DataProvider) {
  const {
    sessions,
    sessionsLoading,
    sessionsError,
    sessionsLoaded,
    setSessionsLoading,
    setSessionsError,
    needsData: sessionsNeedsData
  } = useSessionStore();
  
  const {
    scripts,
    scriptsLoading,
    scriptsError,
    scriptsLoaded,
    setScriptsLoading,
    setScriptsError,
    needsData: scriptsNeedsData
  } = useScriptStore();
  
  const {
    terminalCollections,
    terminalCollectionsLoading,
    terminalCollectionsError,
    terminalCollectionsLoaded,
    setTerminalCollectionsLoading,
    setTerminalCollectionsError,
    needsData: terminalCollectionsNeedsData
  } = useTerminalCollectionStore();


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
    if (sessionsNeedsData()) {
      initializeSessions();
    }
  }, [sessionsLoaded, sessionsLoading]);

  useEffect(() => {
    if (scriptsNeedsData()) {
      initializeScripts();
    }
  }, [scriptsLoaded, scriptsLoading]);

  useEffect(() => {
    if (terminalCollectionsNeedsData()) {
      initializeTerminalCollections();
    }
  }, [terminalCollectionsLoaded, terminalCollectionsLoading]);

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