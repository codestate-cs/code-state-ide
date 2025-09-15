import { memo, lazy, Suspense } from 'preact/compat';
import { useState, useEffect, useMemo, useCallback } from 'preact/hooks';
import { Tabs } from './Tabs';

// Lazy load list components
const SessionList = lazy(() => import('./SessionList').then(module => ({ default: module.SessionList })));
const ScriptList = lazy(() => import('./ScriptList').then(module => ({ default: module.ScriptList })));
const TerminalCollectionList = lazy(() => import('./TerminalCollectionList').then(module => ({ default: module.TerminalCollectionList })));
import type { SessionWithFullData, Script, TerminalCollectionWithScripts } from '../types/session';
import type { UIEvent } from '../store/codestateStore';
import './MainTabs.css';

interface MainTabsProps {
  sessions: SessionWithFullData[];
  scripts: Script[];
  terminalCollections: TerminalCollectionWithScripts[];
  sessionsLoading: boolean;
  scriptsLoading: boolean;
  terminalCollectionsLoading: boolean;
  initializeSessions: () => void;
  initializeScripts: () => void;
  initializeTerminalCollections: () => void;
  onEvent: (event: UIEvent) => void;
}

export const MainTabs = memo(function MainTabs({
  sessions,
  scripts,
  terminalCollections,
  sessionsLoading,
  scriptsLoading,
  terminalCollectionsLoading,
  initializeSessions,
  initializeScripts,
  initializeTerminalCollections,
  onEvent
}: MainTabsProps) {
  const [activeTab, setActiveTab] = useState('sessions');

  // Memoize tab change handler
  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
  }, []);

  // Load data when tab changes
  useEffect(() => {
    switch (activeTab) {
      case 'sessions':
        initializeSessions();
        break;
      case 'scripts':
        initializeScripts();
        break;
      case 'terminal-collections':
        initializeTerminalCollections();
        break;
    }
  }, [activeTab, initializeSessions, initializeScripts, initializeTerminalCollections]);

  // Memoize tab content with lazy loading
  const tabContent = useMemo(() => ({
    sessions: (
      <Suspense fallback={<div className="tab-loading">Loading sessions...</div>}>
        <SessionList
          sessions={sessions}
          isLoading={sessionsLoading}
          onEvent={onEvent}
        />
      </Suspense>
    ),
    scripts: (
      <Suspense fallback={<div className="tab-loading">Loading scripts...</div>}>
        <ScriptList
          scripts={scripts}
          isLoading={scriptsLoading}
          onEvent={onEvent}
        />
      </Suspense>
    ),
    'terminal-collections': (
      <Suspense fallback={<div className="tab-loading">Loading terminal collections...</div>}>
        <TerminalCollectionList
          terminalCollections={terminalCollections}
          isLoading={terminalCollectionsLoading}
          onEvent={onEvent}
        />
      </Suspense>
    )
  }), [sessions, scripts, terminalCollections, sessionsLoading, scriptsLoading, terminalCollectionsLoading, onEvent]);

  // Memoize tab items
  const tabItems = useMemo(() => [
    {
      id: 'sessions',
      label: `Sessions (${sessions.length})`,
      content: tabContent.sessions
    },
    {
      id: 'scripts',
      label: `Scripts (${scripts.length})`,
      content: tabContent.scripts
    },
    {
      id: 'terminal-collections',
      label: `Terminal Collections (${terminalCollections.length})`,
      content: tabContent['terminal-collections']
    }
  ], [sessions.length, scripts.length, terminalCollections.length, tabContent]);

  return (
    <div className="main-tabs">
      <Tabs 
        items={tabItems} 
        variant="pills"
        className="main-tabs-container"
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
    </div>
  );
});