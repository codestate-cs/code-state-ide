import { create } from 'zustand';
import type { SessionWithFullData } from '../types/session';

interface SessionStore {
  // Data state
  sessions: SessionWithFullData[];
  
  // Loading states
  sessionsLoading: boolean;
  
  // Error states
  sessionsError: string | null;
  
  // Data loaded flags
  sessionsLoaded: boolean;
  
  // UI State
  createSessionDialog: {
    isOpen: boolean;
    sessionData: any | null;
    sessionDataError: string | null;
  };
  
  // Temp session data for pending creation
  tempSessionData: SessionWithFullData | null;
  
  // Session popup state
  currentSession: SessionWithFullData | null;
  isEditDialogOpen: boolean;
  isDeleteDialogOpen: boolean;
  
  // Session creation feedback
  newlyCreatedSessionId: string | null;
  showSessionCreatedFeedback: boolean;
  
  // Actions
  setSessions: (sessions: SessionWithFullData[]) => void;
  addSession: (session: SessionWithFullData) => void;
  removeSession: (sessionId: string) => void;
  updateSession: (session: SessionWithFullData) => void;
  
  setSessionsLoading: (loading: boolean) => void;
  setSessionsError: (error: string | null) => void;
  setSessionsLoaded: (loaded: boolean) => void;
  
  // UI Actions
  setCreateSessionDialog: (state: Partial<SessionStore['createSessionDialog']>) => void;
  openCreateSessionDialog: () => void;
  closeCreateSessionDialog: () => void;
  setSessionData: (data: any | null) => void;
  setSessionDataError: (error: string | null) => void;
  
  // Temp session actions
  setTempSessionData: (sessionData: SessionWithFullData | null) => void;
  addTempSessionWithId: (sessionId: string) => void;
  
  // Session popup actions
  setCurrentSession: (session: SessionWithFullData | null) => void;
  openEditDialog: (session: SessionWithFullData) => void;
  closeEditDialog: () => void;
  openDeleteDialog: (session: SessionWithFullData) => void;
  
  // Session creation feedback actions
  setNewlyCreatedSessionId: (sessionId: string | null) => void;
  displaySessionCreatedFeedback: (sessionId: string) => void;
  hideSessionCreatedFeedback: () => void;
  
  // Helper methods
  isLoading: () => boolean;
  hasError: () => boolean;
  isLoaded: () => boolean;
  needsData: () => boolean;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  // Initial state
  sessions: [],
  sessionsLoading: false,
  sessionsError: null,
  sessionsLoaded: false,
  
  // UI State
  createSessionDialog: {
    isOpen: false,
    sessionData: null,
    sessionDataError: null,
  },
  
  // Temp session data for pending creation
  tempSessionData: null,
  
  // Session popup state
  currentSession: null,
  isEditDialogOpen: false,
  isDeleteDialogOpen: false,
  
  // Session creation feedback
  newlyCreatedSessionId: null,
  showSessionCreatedFeedback: false,
  
  // Actions
  setSessions: (sessions) => {
    console.log('SessionStore: setSessions called with:', sessions);
    set({ sessions });
  },
  addSession: (session) => set((state) => ({ sessions: [...state.sessions, session] })),
  removeSession: (sessionId) => set((state) => ({ 
    sessions: state.sessions.filter(s => s.id !== sessionId) 
  })),
  updateSession: (session) => set((state) => ({
    sessions: state.sessions.map(s => s.id === session.id ? session : s)
  })),
  
  setSessionsLoading: (loading) => set({ sessionsLoading: loading }),
  setSessionsError: (error) => set({ sessionsError: error }),
  setSessionsLoaded: (loaded) => set({ sessionsLoaded: loaded }),
  
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
  
  // Session popup actions
  setCurrentSession: (session) => set({ currentSession: session }),
  
  openEditDialog: (session) => set({ 
    currentSession: session, 
    isEditDialogOpen: true,
    isDeleteDialogOpen: false 
  }),
  
  closeEditDialog: () => set({ 
    isEditDialogOpen: false,
    currentSession: null 
  }),
  
  openDeleteDialog: (session) => set({ 
    currentSession: session, 
    isDeleteDialogOpen: true,
    isEditDialogOpen: false 
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
  
  // Helper methods
  isLoading: () => get().sessionsLoading,
  hasError: () => !!get().sessionsError,
  isLoaded: () => get().sessionsLoaded,
  needsData: () => !get().sessionsLoaded && !get().sessionsLoading
}));