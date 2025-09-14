import { useState, useEffect } from 'preact/hooks';
import { Card, CardContent } from './Card';
import { SessionCard } from './SessionCard';
import { Accordion } from './Accordion';
import { useCodeStateStore } from '../store/codestateStore';
import type { SessionListProps } from '../types/session';
import type { SessionWithFullData } from '../types/session';
import './SessionList.css';

export function SessionList({
  sessions,
  isLoading,
  onEvent
}: SessionListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { 
    currentProjectRoot, 
    newlyCreatedSessionId, 
    showSessionCreatedFeedback,
    hideSessionCreatedFeedback 
  } = useCodeStateStore();
  
  console.log('SessionList: Received sessions:', sessions);
  console.log('SessionList: isLoading:', isLoading);
  console.log('SessionList: sessions.length:', sessions.length);
  console.log('SessionList: sessions type:', typeof sessions);
  console.log('SessionList: sessions is array:', Array.isArray(sessions));
  console.log('SessionList: currentProjectRoot:', currentProjectRoot);

  // Hide feedback after 3 seconds
  useEffect(() => {
    if (showSessionCreatedFeedback && newlyCreatedSessionId) {
      const timer = setTimeout(() => {
        hideSessionCreatedFeedback();
      }, 3000); // 3 seconds
      
      return () => clearTimeout(timer);
    }
  }, [showSessionCreatedFeedback, newlyCreatedSessionId, hideSessionCreatedFeedback]);

  // Event delegation handler
  const handleEventDelegation = (e: Event) => {
    const target = e.target as HTMLElement;
    const action = target.dataset.action;
    const sessionId = target.dataset.sessionId;
    
    if (!action) return;
    
    switch (action) {
      case 'create-session':
        onEvent({ type: 'CREATE_SESSION' });
        break;
      case 'resume-session':
        if (sessionId) onEvent({ type: 'RESUME_SESSION', payload: { id: sessionId } });
        break;
      case 'edit-session':
        if (sessionId) onEvent({ type: 'EDIT_SESSION', payload: { id: sessionId } });
        break;
      case 'delete-session':
        if (sessionId) onEvent({ type: 'DELETE_SESSION', payload: { id: sessionId } });
        break;
      case 'export-session':
        if (sessionId) onEvent({ type: 'EXPORT_SESSION', payload: { id: sessionId } });
        break;
    }
  };

  // Filter sessions based on search term
  const filteredSessions = sessions.filter(session => 
    session.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  console.log('SessionList: filteredSessions:', filteredSessions);
  console.log('SessionList: filteredSessions.length:', filteredSessions.length);

  // Group sessions by rootPath
  const groupSessionsByPath = (sessions: SessionWithFullData[]) => {
    const groups: { [key: string]: SessionWithFullData[] } = {};
    
    sessions.forEach(session => {
      const rootPath = session.projectRoot;
      if (!groups[rootPath]) {
        groups[rootPath] = [];
      }
      groups[rootPath].push(session);
    });
    
    return groups;
  };

  const sessionGroups = groupSessionsByPath(filteredSessions);
  const groupEntries = Object.entries(sessionGroups);
  
  // Sort accordion items to ensure current project is always first
  const sortedGroupEntries = groupEntries.sort(([a], [b]) => {
    const aIsCurrent = a === currentProjectRoot;
    const bIsCurrent = b === currentProjectRoot;
    
    if (aIsCurrent && !bIsCurrent) return -1;
    if (!aIsCurrent && bIsCurrent) return 1;
    return 0; // Keep original order for non-current projects
  });

  // Create accordion items from grouped sessions
  const accordionItems = sortedGroupEntries.map(([rootPath, groupSessions]) => {
    const projectName = rootPath.split('/').pop() || rootPath;
    const isCurrentProject = currentProjectRoot === rootPath;
    
    // Check if this group contains the newly created session
    const hasNewlyCreatedSession = newlyCreatedSessionId && 
      groupSessions.some(session => session.id === newlyCreatedSessionId);
    
    return {
      id: `group-${rootPath}`,
      defaultOpen: isCurrentProject || !!hasNewlyCreatedSession, // Open if current project or has newly created session
      title: (
        <div className="accordion-title-content">
          <span className="project-name">{projectName}</span>
          <span className="session-count">({groupSessions.length} session{groupSessions.length !== 1 ? 's' : ''})</span>
          {hasNewlyCreatedSession && showSessionCreatedFeedback && (
            <span className="new-session-indicator">✨ New!</span>
          )}
          <span className="accordion-title-path">{rootPath}</span>
        </div>
      ),
      content: (
        <div className="session-group-content">
          <div className="session-group-grid">
            {groupSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                isNewlyCreated={session.id === newlyCreatedSessionId && showSessionCreatedFeedback}
              />
            ))}
          </div>
        </div>
      )
    };
  });
  if (isLoading) {
    return (
      <div className="session-list">
        <div className="session-list-header">
          <h2>Sessions</h2>
          <div className="session-list-actions">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search sessions..."
                className="search-input"
                disabled
              />
            </div>
            <button className="btn-primary" disabled>
              Create Session
            </button>
          </div>
        </div>
        <div className="session-list-content">
          <div className="session-group-grid">
            {Array.from({ length: 3 }).map((_, index) => ( 
            <div className="skeleton-session-card" key={`session-card-loading-${index}`}>
              <div className="skeleton-header">
                <div className="skeleton-title-section">
                  <div className="skeleton-title"></div>
                </div>
                <div className="skeleton-actions">
                  <div className="skeleton-resume-btn"></div>
                  <div className="skeleton-action-btn"></div>
                  <div className="skeleton-action-btn"></div>
                  <div className="skeleton-action-btn"></div>
                </div>
              </div>
              <div className="skeleton-content">
                <div className="skeleton-detail">
                  <div className="skeleton-label"></div>
                  <div className="skeleton-value"></div>
                </div>
                <div className="skeleton-detail">
                  <div className="skeleton-label"></div>
                  <div className="skeleton-value"></div>
                </div>
                <div className="skeleton-detail">
                  <div className="skeleton-label"></div>
                  <div className="skeleton-value"></div>
                </div>
                <div className="skeleton-detail">
                  <div className="skeleton-label"></div>
                  <div className="skeleton-value"></div>
                </div>
                <div className="skeleton-detail">
                  <div className="skeleton-label"></div>
                  <div className="skeleton-value"></div>
                </div>
                <div className="skeleton-detail">
                  <div className="skeleton-label"></div>
                  <div className="skeleton-value"></div>
                </div>
                <div className="skeleton-timestamps">
                  <div className="skeleton-timestamp">
                    <div className="skeleton-label"></div>
                    <div className="skeleton-value"></div>
                  </div>
                  <div className="skeleton-timestamp">
                    <div className="skeleton-label"></div>
                    <div className="skeleton-value"></div>
                  </div>
                </div>
              </div>
            </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="session-list" onClick={handleEventDelegation}>
      <div className="session-list-header">
        <h2>Sessions</h2>
        <div className="session-list-actions">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search sessions..."
              className="search-input"
              value={searchTerm}
              onInput={(e) => setSearchTerm((e.target as HTMLInputElement)?.value || '')}
            />
          </div>
          <button 
            className="btn-primary"
            data-action="create-session"
          >
            Create Session
          </button>
        </div>
      </div>
      
      <div className="session-list-content">
        {filteredSessions.length === 0 ? (
          <Card variant="outlined" className="empty-state">
            <CardContent>
              <div className="empty-state-content">
                <h3>{searchTerm ? 'No sessions match your search' : 'No sessions found'}</h3>
                <p>{searchTerm ? `No sessions found matching "${searchTerm}". Try a different search term.` : 'Create your first session to get started with CodeState.'}</p>
                {!searchTerm && (
                  <button 
                    className="btn-primary"
                    data-action="create-session"
                  >
                    Create Your First Session
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="session-accordion-container">
            <Accordion items={accordionItems} />
          </div>
        )}
      </div>
    </div>
  );
}