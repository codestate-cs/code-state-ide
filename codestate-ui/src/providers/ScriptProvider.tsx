import { memo, createContext, useContext } from 'preact/compat';
import { useScriptStore } from '../store/combinedStore';
import type { Script } from '../types/session';

interface ScriptContextValue {
  scripts: Script[];
  scriptsLoading: boolean;
  scriptsError: string | null;
  scriptsLoaded: boolean;
  initializeScripts: () => void;
  addScript: (script: Script) => void;
  removeScript: (scriptId: string) => void;
  updateScript: (script: Script) => void;
}

const ScriptContext = createContext<ScriptContextValue | null>(null);

interface ScriptProviderProps {
  children: React.ReactNode;
}

export const ScriptProvider = memo(function ScriptProvider({ children }: ScriptProviderProps) {
  const {
    scripts,
    scriptsLoading,
    scriptsError,
    scriptsLoaded,
    setScripts,
    addScript,
    removeScript,
    updateScript,
    setScriptsLoading,
    setScriptsError,
    setScriptsLoaded,
    needsData: scriptsNeedsData
  } = useScriptStore();

  const initializeScripts = () => {
    if (scriptsLoaded || scriptsLoading) return;
    setScriptsLoading(true);
    setScriptsError(null);
    // Note: The actual initialization will be handled by the data loader
    // This provider just exposes the interface
  };

  const contextValue: ScriptContextValue = {
    scripts,
    scriptsLoading,
    scriptsError,
    scriptsLoaded,
    initializeScripts,
    addScript,
    removeScript,
    updateScript
  };

  return (
    <ScriptContext.Provider value={contextValue}>
      {children}
    </ScriptContext.Provider>
  );
});

export function useScriptContext() {
  const context = useContext(ScriptContext);
  if (!context) {
    throw new Error('useScriptContext must be used within a ScriptProvider');
  }
  return context;
}