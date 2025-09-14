import { useCodeStateStore } from '../store/codestateStore';

export class DataManager {
  private store = useCodeStateStore.getState();

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
    this.store.setSessions(data.sessions || []);
    this.store.setCurrentProjectRoot(data.currentProjectRoot || null);
    this.store.setSessionsLoaded(true);
    this.store.setSessionsLoading(false);
  }

  // Handle scripts init response
  handleScriptsInitResponse(data: any): void {
    console.log('DataManager: Received scripts init response', data);
    this.store.setScripts(data.scripts || []);
    this.store.setScriptsLoaded(true);
    this.store.setScriptsLoading(false);
  }

  // Handle terminal collections init response
  handleTerminalCollectionsInitResponse(data: any): void {
    console.log('DataManager: Received terminal collections init response', data);
    this.store.setTerminalCollections(data.terminalCollections || []);
    this.store.setTerminalCollectionsLoaded(true);
    this.store.setTerminalCollectionsLoading(false);
  }
}