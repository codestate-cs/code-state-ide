import { memo, createContext, useContext } from 'preact/compat';
import { useConfigStore } from '../store/combinedStore';

interface ConfigContextValue {
  currentProjectRoot: string | null;
  configDialog: {
    isOpen: boolean;
    configData: any | null;
    configDataError: string | null;
  };
  setCurrentProjectRoot: (rootPath: string | null) => void;
  openConfigDialog: () => void;
  closeConfigDialog: () => void;
  setConfigData: (data: any | null) => void;
  setConfigDataError: (error: string | null) => void;
}

const ConfigContext = createContext<ConfigContextValue | null>(null);

interface ConfigProviderProps {
  children: React.ReactNode;
}

export const ConfigProvider = memo(function ConfigProvider({ children }: ConfigProviderProps) {
  const {
    currentProjectRoot,
    configDialog,
    setCurrentProjectRoot,
    openConfigDialog,
    closeConfigDialog,
    setConfigData,
    setConfigDataError
  } = useConfigStore();

  const contextValue: ConfigContextValue = {
    currentProjectRoot,
    configDialog,
    setCurrentProjectRoot,
    openConfigDialog,
    closeConfigDialog,
    setConfigData,
    setConfigDataError
  };

  return (
    <ConfigContext.Provider value={contextValue}>
      {children}
    </ConfigContext.Provider>
  );
});

export function useConfigContext() {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfigContext must be used within a ConfigProvider');
  }
  return context;
}