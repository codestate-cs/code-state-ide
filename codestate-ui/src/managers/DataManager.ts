import { useSessionStore, useScriptStore, useTerminalCollectionStore, useConfigStore } from '../store/combinedStore';

export class DataManager {

  // Initialize sessions data
  initializeSessions(): void {
    console.log('DataManager: Initializing sessions');
    // This will be called by the provider to trigger sessions init
  }

  // Initialize scripts data
  initializeScripts(): void {
    console.log('DataManager: Initializing scripts');
    // This will be called by the provider to trigger scripts init
  }

  // Initialize terminal collections data
  initializeTerminalCollections(): void {
    console.log('DataManager: Initializing terminal collections');
    // This will be called by the provider to trigger terminal collections init
  }

  // Handle sessions init response
  handleSessionsInitResponse(data: any): void {
    console.log('DataManager: Received sessions init response', data);
    const sessionStore = useSessionStore.getState();
    const configStore = useConfigStore.getState();
    
    const sessions = data.sessions || [];
    sessionStore.setSessions(sessions);
    sessionStore.setSessionsLoaded(true);
    sessionStore.setSessionsLoading(false);
    
    // Extract current project root from sessions data
    // Priority: 1) data.currentProjectRoot, 2) first session's projectRoot, 3) null
    const currentProjectRoot = data.currentProjectRoot || 
                              (sessions.length > 0 ? sessions[0].projectRoot : null);
    
    if (currentProjectRoot) {
      console.log('DataManager: Setting current project root to:', currentProjectRoot);
      configStore.setCurrentProjectRoot(currentProjectRoot);
    }
  }

  // Handle scripts init response
  handleScriptsInitResponse(data: any): void {
    console.log('DataManager: Received scripts init response', data);
    const scriptStore = useScriptStore.getState();
    scriptStore.setScripts(data.scripts || []);
    scriptStore.setScriptsLoaded(true);
    scriptStore.setScriptsLoading(false);
  }

  // Handle terminal collections init response
  handleTerminalCollectionsInitResponse(data: any): void {
    console.log('DataManager: Received terminal collections init response', data);
    const terminalCollectionStore = useTerminalCollectionStore.getState();
    terminalCollectionStore.setTerminalCollections(data.terminalCollections || []);
    terminalCollectionStore.setTerminalCollectionsLoaded(true);
    terminalCollectionStore.setTerminalCollectionsLoading(false);
  }
}