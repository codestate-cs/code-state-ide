import { useState, useEffect } from 'preact/hooks';
import { Card, CardContent } from './Card';
import { ScriptCard } from './ScriptCard';
import { Accordion } from './Accordion';
import { useCodeStateStore } from '../store/codestateStore';
import type { Script } from '../types/session';
import type { UIEvent } from '../store/codestateStore';
import './ScriptList.css';

interface ScriptListProps {
  scripts: Script[];
  isLoading: boolean;
  onEvent: (event: UIEvent) => void;
}

export function ScriptList({
  scripts,
  isLoading,
  onEvent
}: ScriptListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { 
    currentProjectRoot, 
    newlyCreatedScriptId, 
    showScriptCreatedFeedback,
    hideScriptCreatedFeedback,
    openCreateScriptDialog
  } = useCodeStateStore();
  
  console.log('ScriptList: Received scripts:', scripts);
  console.log('ScriptList: isLoading:', isLoading);
  console.log('ScriptList: scripts.length:', scripts.length);
  console.log('ScriptList: currentProjectRoot:', currentProjectRoot);

  // Hide feedback after 3 seconds
  useEffect(() => {
    if (showScriptCreatedFeedback && newlyCreatedScriptId) {
      const timer = setTimeout(() => {
        hideScriptCreatedFeedback();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [showScriptCreatedFeedback, newlyCreatedScriptId, hideScriptCreatedFeedback]);

  // Event delegation handler
  const handleEventDelegation = (e: Event) => {
    const target = e.target as HTMLElement;
    const action = target.dataset.action;
    const scriptId = target.dataset.scriptId;
    
    if (!action) return;
    
    switch (action) {
      case 'create-script':
        openCreateScriptDialog(currentProjectRoot || '');
        break;
      case 'run-script':
        if (scriptId) {
          onEvent({ type: 'RUN_SCRIPT', payload: { id: scriptId } });
        }
        break;
      case 'edit-script':
        if (scriptId) {
          onEvent({ type: 'EDIT_SCRIPT', payload: { id: scriptId } });
        }
        break;
      case 'delete-script':
        if (scriptId) {
          onEvent({ type: 'DELETE_SCRIPT', payload: { id: scriptId } });
        }
        break;
    }
  };

  // Filter scripts based on search term
  const filteredScripts = scripts.filter(script =>
    script.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  console.log('ScriptList: filteredScripts:', filteredScripts);
  console.log('ScriptList: filteredScripts.length:', filteredScripts.length);

  // Group scripts by rootPath
  const groupScriptsByPath = (scripts: Script[]) => {
    const groups: { [key: string]: Script[] } = {};
    
    scripts.forEach(script => {
      const rootPath = script.rootPath;
      if (!groups[rootPath]) {
        groups[rootPath] = [];
      }
      groups[rootPath].push(script);
    });
    
    return groups;
  };

  const scriptGroups = groupScriptsByPath(filteredScripts);
  const groupEntries = Object.entries(scriptGroups);
  
  // Sort accordion items to ensure current project is always first
  const sortedGroupEntries = groupEntries.sort(([a], [b]) => {
    const aIsCurrent = a === currentProjectRoot;
    const bIsCurrent = b === currentProjectRoot;
    
    if (aIsCurrent && !bIsCurrent) return -1;
    if (!aIsCurrent && bIsCurrent) return 1;
    return 0; // Keep original order for non-current projects
  });

  // Create accordion items from grouped scripts
  const accordionItems = sortedGroupEntries.map(([rootPath, groupScripts]) => {
    const projectName = rootPath.split('/').pop() || rootPath;
    const isCurrentProject = currentProjectRoot === rootPath;
    
    // Check if this group contains the newly created script
    const hasNewlyCreatedScript = newlyCreatedScriptId && 
      groupScripts.some(script => script.id === newlyCreatedScriptId);
    
    return {
      id: `group-${rootPath}`,
      defaultOpen: isCurrentProject || !!hasNewlyCreatedScript, // Open if current project or has newly created script
      title: (
        <div className="accordion-title-content">
          <span className="project-name">{projectName}</span>
          <span className="script-count">({groupScripts.length} script{groupScripts.length !== 1 ? 's' : ''})</span>
          {hasNewlyCreatedScript && showScriptCreatedFeedback && (
            <span className="new-script-indicator">✨ New!</span>
          )}
          <span className="accordion-title-path">{rootPath}</span>
        </div>
      ),
      content: (
        <div className="script-group-content">
          <div className="script-group-grid">
            {groupScripts.map((script) => (
              <ScriptCard
                key={script.id}
                script={script}
                isNewlyCreated={script.id === newlyCreatedScriptId && showScriptCreatedFeedback}
              />
            ))}
          </div>
        </div>
      )
    };
  });

  if (isLoading) {
    return (
      <div className="script-list">
        <div className="script-list-header">
          <h2>Scripts</h2>
          <div className="script-list-actions">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search scripts..."
                className="search-input"
                disabled
              />
            </div>
            <button className="btn-primary" disabled>
              Create Script
            </button>
          </div>
        </div>
        <div className="script-list-content">
          <div className="script-group-grid">
            {Array.from({ length: 3 }).map((_, index) => (
              <div className="skeleton-card" key={`script-card-loading-${index}`}>
                <div className="skeleton-header">
                  <div className="skeleton-title-section">
                    <div className="skeleton-title"></div>
                    <div className="skeleton-id"></div>
                  </div>
                  <div className="skeleton-run-button"></div>
                  <div className="skeleton-button"></div>
                  <div className="skeleton-button"></div>
                </div>
                <div className="skeleton-content">
                  <div className="skeleton-info">
                    <div className="skeleton-info-row">
                      <div className="skeleton-label"></div>
                      <div className="skeleton-value"></div>
                    </div>
                    <div className="skeleton-info-row">
                      <div className="skeleton-label"></div>
                      <div className="skeleton-value"></div>
                    </div>
                    <div className="skeleton-info-row">
                      <div className="skeleton-label"></div>
                      <div className="skeleton-value"></div>
                    </div>
                    <div className="skeleton-info-row">
                      <div className="skeleton-label"></div>
                      <div className="skeleton-value"></div>
                    </div>
                  </div>
                  <div className="skeleton-details">
                    <div className="skeleton-section">
                      <div className="skeleton-section-label"></div>
                      <div className="skeleton-commands-list">
                        <div className="skeleton-command-item">
                          <div className="skeleton-command-name"></div>
                          <div className="skeleton-command-script"></div>
                        </div>
                        <div className="skeleton-command-item">
                          <div className="skeleton-command-name"></div>
                          <div className="skeleton-command-script"></div>
                        </div>
                      </div>
                    </div>
                    <div className="skeleton-section">
                      <div className="skeleton-section-label"></div>
                      <div className="skeleton-section-value"></div>
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
    <div className="script-list" onClick={handleEventDelegation}>
      <div className="script-list-header">
        <h2>Scripts</h2>
        <div className="script-list-actions">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search scripts..."
              className="search-input"
              value={searchTerm}
              onInput={(e) => setSearchTerm((e.target as HTMLInputElement).value)}
            />
          </div>
          <button 
            className="btn-primary"
            data-action="create-script"
          >
            Create Script
          </button>
        </div>
      </div>
      
      <div className="script-list-content">
        {filteredScripts.length === 0 ? (
          <Card variant="outlined" className="empty-state">
            <CardContent>
              <div className="empty-state-content">
                <h3>No scripts found</h3>
                <p>
                  {searchTerm 
                    ? `No scripts match "${searchTerm}". Try a different search term.`
                    : 'Create your first script to automate your workflow.'
                  }
                </p>
                {!searchTerm && (
                  <button 
                    className="btn-primary"
                    data-action="create-script"
                  >
                    Create Your First Script
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Accordion items={accordionItems} />
        )}
      </div>
    </div>
  );
}