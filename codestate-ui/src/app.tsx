import { memo } from 'preact/compat';
import { useEffect, useCallback } from 'preact/hooks';
import { Header } from './components/Header';
import { MainTabs } from './components/MainTabs';
import { PopupManager } from './components/PopupManager';
import { useDataLoader } from './hooks/useDataLoader';
import { useUIEvents } from './hooks/useUIEvents';
import { CombinedProvider } from './providers/CombinedProvider';
import { useConfigContext } from './providers/CombinedProvider';
import type { DataProvider, Theme } from './providers/DataProvider';
import './styles/design-system.css';
import './app.css';

interface AppProps {
  provider: DataProvider;
}

const AppContent = memo(function AppContent({ provider }: AppProps) {
  // Use Zustand store for data management
  const {
    sessions,
    scripts,
    terminalCollections,
    sessionsLoading,
    scriptsLoading,
    terminalCollectionsLoading,
    initializeSessions,
    initializeScripts,
    initializeTerminalCollections
  } = useDataLoader(provider);

  // Get config dialog state from context
  const { configDialog, openConfigDialog } = useConfigContext();

  
  // Event handling
  const { handleEvent } = useUIEvents(provider);

  // Initialize provider
  useEffect(() => {
    const initializeProvider = async () => {
      try {
        await provider.initialize();
        
        // Initialize config data on startup
        provider.initializeConfig();
      } catch (error) {
        console.error('Failed to initialize provider:', error);
      }
    };

    initializeProvider();

    return () => {
      provider.destroy();
    };
  }, [provider]);

  // Listen for config data changes and set theme
  useEffect(() => {
    if (configDialog.configData) {
      const theme = configDialog.configData.extensions?.theme as Theme || 'dark';
      
      // Apply theme to DOM
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [configDialog.configData]);

  const handleConfigClick = useCallback(() => {
    // Open config dialog (data already loaded in Zustand)
    openConfigDialog();
  }, [openConfigDialog]);


  return (
    <div className="app">
      <Header 
        onConfigClick={handleConfigClick}
      />
      
      <div className="app-content">
        {/* Main Tabs - Sessions, Scripts, Terminal Collections */}
        <MainTabs
          sessions={sessions}
          scripts={scripts}
          terminalCollections={terminalCollections}
          sessionsLoading={sessionsLoading}
          scriptsLoading={scriptsLoading}
          terminalCollectionsLoading={terminalCollectionsLoading}
          initializeSessions={initializeSessions}
          initializeScripts={initializeScripts}
          initializeTerminalCollections={initializeTerminalCollections}
          onEvent={handleEvent}
        />
        
        {/* Popup Manager - handles all dialogs */}
        <PopupManager provider={provider} />
      </div>
    </div>
  );
});

export const App = memo(function App({ provider }: AppProps) {
  return (
    <CombinedProvider>
      <AppContent provider={provider} />
    </CombinedProvider>
  );
});
