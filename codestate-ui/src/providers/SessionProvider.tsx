import { memo, createContext, useContext } from 'preact/compat';
import { useSessionStore } from '../store/combinedStore';
import type { SessionWithFullData } from '../types/session';

interface SessionContextValue {
  sessions: SessionWithFullData[];
  sessionsLoading: boolean;
  sessionsError: string | null;
  sessionsLoaded: boolean;
  initializeSessions: () => void;
  addSession: (session: SessionWithFullData) => void;
  removeSession: (sessionId: string) => void;
  updateSession: (session: SessionWithFullData) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

interface SessionProviderProps {
  children: React.ReactNode;
}

export const SessionProvider = memo(function SessionProvider({ children }: SessionProviderProps) {
  const {
    sessions,
    sessionsLoading,
    sessionsError,
    sessionsLoaded,
    addSession,
    removeSession,
    updateSession,
    setSessionsLoading,
    setSessionsError
  } = useSessionStore();

  const initializeSessions = () => {
    if (sessionsLoaded || sessionsLoading) return;
    setSessionsLoading(true);
    setSessionsError(null);
    // Note: The actual initialization will be handled by the data loader
    // This provider just exposes the interface
  };

  const contextValue: SessionContextValue = {
    sessions,
    sessionsLoading,
    sessionsError,
    sessionsLoaded,
    initializeSessions,
    addSession,
    removeSession,
    updateSession
  };

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
});

export function useSessionContext() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSessionContext must be used within a SessionProvider');
  }
  return context;
}