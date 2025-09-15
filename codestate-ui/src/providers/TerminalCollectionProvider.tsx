import { memo, createContext, useContext } from 'preact/compat';
import { useTerminalCollectionStore } from '../store/combinedStore';
import type { TerminalCollectionWithScripts } from '../types/session';

interface TerminalCollectionContextValue {
  terminalCollections: TerminalCollectionWithScripts[];
  terminalCollectionsLoading: boolean;
  terminalCollectionsError: string | null;
  terminalCollectionsLoaded: boolean;
  initializeTerminalCollections: () => void;
  addTerminalCollection: (terminalCollection: TerminalCollectionWithScripts) => void;
  removeTerminalCollection: (terminalCollectionId: string) => void;
  updateTerminalCollection: (terminalCollection: TerminalCollectionWithScripts) => void;
}

const TerminalCollectionContext = createContext<TerminalCollectionContextValue | null>(null);

interface TerminalCollectionProviderProps {
  children: React.ReactNode;
}

export const TerminalCollectionProvider = memo(function TerminalCollectionProvider({ children }: TerminalCollectionProviderProps) {
  const {
    terminalCollections,
    terminalCollectionsLoading,
    terminalCollectionsError,
    terminalCollectionsLoaded,
    addTerminalCollection,
    removeTerminalCollection,
    updateTerminalCollection,
    setTerminalCollectionsLoading,
    setTerminalCollectionsError
  } = useTerminalCollectionStore();

  const initializeTerminalCollections = () => {
    if (terminalCollectionsLoaded || terminalCollectionsLoading) return;
    setTerminalCollectionsLoading(true);
    setTerminalCollectionsError(null);
    // Note: The actual initialization will be handled by the data loader
    // This provider just exposes the interface
  };

  const contextValue: TerminalCollectionContextValue = {
    terminalCollections,
    terminalCollectionsLoading,
    terminalCollectionsError,
    terminalCollectionsLoaded,
    initializeTerminalCollections,
    addTerminalCollection,
    removeTerminalCollection,
    updateTerminalCollection
  };

  return (
    <TerminalCollectionContext.Provider value={contextValue}>
      {children}
    </TerminalCollectionContext.Provider>
  );
});

export function useTerminalCollectionContext() {
  const context = useContext(TerminalCollectionContext);
  if (!context) {
    throw new Error('useTerminalCollectionContext must be used within a TerminalCollectionProvider');
  }
  return context;
}