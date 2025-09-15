import { useSessionStore } from '../store/combinedStore';

export class SessionManager {

  // Session initialization
  initializeSessions(): void {
    console.log('SessionManager: Initializing sessions');
    // This will be called by the provider to trigger session init
  }

  // Handle session init response
  handleSessionsInitResponse(data: any): void {
    console.log('SessionManager: Received sessions init response', data);
    const sessionStore = useSessionStore.getState();
    sessionStore.setSessions(data.sessions || []);
    sessionStore.setSessionsLoaded(true);
    sessionStore.setSessionsLoading(false);
  }

  // Handle session create response
  handleSessionCreateResponse(data: any): void {
    console.log('SessionManager: Received session create response', data);
    const sessionStore = useSessionStore.getState();
    if (data.payload && data.payload.success) {
      // Add the temp session with the received ID to the store
      if (data.payload.id) {
        sessionStore.addTempSessionWithId(data.payload.id);
        sessionStore.displaySessionCreatedFeedback(data.payload.id);
      }
      // Close the create session dialog
      sessionStore.closeCreateSessionDialog();
    } else if (data.payload && data.payload.error) {
      // Handle error case
      console.error('Session creation failed:', data.payload.error);
      sessionStore.setSessionDataError(data.payload.error);
    }
  }

  // Handle session delete response
  handleSessionDeleteResponse(data: any): void {
    console.log('SessionManager: Received session delete response', data);
    const sessionStore = useSessionStore.getState();
    if (data.status === 'success') {
      sessionStore.removeSession(data.payload.id);
    }
  }

  // Handle session update response
  handleSessionUpdateResponse(data: any): void {
    console.log('SessionManager: Received session update response', data);
    const sessionStore = useSessionStore.getState();
    if (data.status === 'success') {
      // Close the edit dialog
      sessionStore.closeEditDialog();
      
      // Update the session in the store
      sessionStore.updateSession(data.payload.session);
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
    const sessionStore = useSessionStore.getState();
    if (data.status === 'error') {
      sessionStore.setSessionDataError(data.error);
    } else {
      sessionStore.setSessionData(data.sessionData);
      sessionStore.openCreateSessionDialog();
    }
  }
}