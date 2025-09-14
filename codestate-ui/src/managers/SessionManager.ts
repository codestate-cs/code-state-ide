import { useCodeStateStore } from '../store/codestateStore';

export class SessionManager {
  private store = useCodeStateStore.getState();

  // Session initialization
  initializeSessions(): void {
    console.log('SessionManager: Initializing sessions');
    // This will be called by the provider to trigger session init
  }

  // Handle session init response
  handleSessionsInitResponse(data: any): void {
    console.log('SessionManager: Received sessions init response', data);
    this.store.setSessions(data.sessions || []);
    this.store.setCurrentProjectRoot(data.currentProjectRoot || null);
    this.store.setSessionsLoaded(true);
    this.store.setSessionsLoading(false);
  }

  // Handle session create response
  handleSessionCreateResponse(data: any): void {
    console.log('SessionManager: Received session create response', data);
    if (data.payload && data.payload.success) {
      // Add the temp session with the received ID to the store
      if (data.payload.id) {
        this.store.addTempSessionWithId(data.payload.id);
        this.store.displaySessionCreatedFeedback(data.payload.id);
      }
      // Close the create session dialog
      this.store.closeCreateSessionDialog();
    } else if (data.payload && data.payload.error) {
      // Handle error case
      console.error('Session creation failed:', data.payload.error);
      this.store.setSessionDataError(data.payload.error);
    }
  }

  // Handle session delete response
  handleSessionDeleteResponse(data: any): void {
    console.log('SessionManager: Received session delete response', data);
    if (data.status === 'success') {
      this.store.removeSession(data.payload.id);
    }
  }

  // Handle session update response
  handleSessionUpdateResponse(data: any): void {
    console.log('SessionManager: Received session update response', data);
    if (data.status === 'success') {
      // Close the edit dialog
      this.store.closeAllDialogs();
      
      // Update the session in the store
      this.store.updateSession(data.payload.session);
    }
  }

  // Handle session resume response
  handleSessionResumeResponse(data: any): void {
    console.log('SessionManager: Received session resume response', data);
    // Handle resume response if needed
  }

  // Handle session export response
  handleSessionExportResponse(data: any): void {
    console.log('SessionManager: Received session export response', data);
    // Handle export response if needed
  }

  // Handle session create init response
  handleSessionCreateInitResponse(data: any): void {
    console.log('SessionManager: Received session create init response', data);
    if (data.status === 'error') {
      this.store.setSessionDataError(data.error);
    } else {
      this.store.setSessionData(data.sessionData);
      this.store.openCreateSessionDialog();
    }
  }
}