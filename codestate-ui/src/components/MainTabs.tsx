import { useState, useEffect } from 'preact/hooks';
import { Tabs } from './Tabs';
import { SessionList } from './SessionList';
import { ScriptList } from './ScriptList';
import { TerminalCollectionList } from './TerminalCollectionList';
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

export function MainTabs({
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
  const tabItems = [
    {
      id: 'sessions',
      label: `Sessions (${sessions.length})`,
      content: (
        <SessionList
          sessions={sessions}
          isLoading={sessionsLoading}
          onEvent={onEvent}
        />
      )
    },
    {
      id: 'scripts',
      label: `Scripts (${scripts.length})`,
      content: (
        <ScriptList
          scripts={scripts}
          isLoading={scriptsLoading}
          onEvent={onEvent}
        />
      )
    },
    {
      id: 'terminal-collections',
      label: `Terminal Collections (${terminalCollections.length})`,
      content: (
        <TerminalCollectionList
          terminalCollections={terminalCollections}
          isLoading={terminalCollectionsLoading}
          onEvent={onEvent}
        />
      )
    }
  ];

  return (
    <div className="main-tabs">
      <Tabs 
        items={tabItems} 
        variant="pills"
        className="main-tabs-container"
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
}