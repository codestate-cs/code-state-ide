import { useEffect } from 'preact/hooks';
import { Card, CardContent, CardHeader } from './Card';
import type { TerminalCollectionWithScripts } from '../types/session';
import type { UIEvent } from '../store/codestateStore';
import { useCodeStateStore } from '../store/codestateStore';
import './TerminalCollectionList.css';

interface TerminalCollectionListProps {
  terminalCollections: TerminalCollectionWithScripts[];
  isLoading: boolean;
  onEvent: (event: UIEvent) => void;
}

export function TerminalCollectionList({
  terminalCollections,
  isLoading,
  onEvent
}: TerminalCollectionListProps) {
  const {
    currentProjectRoot,
    newlyCreatedTerminalCollectionId,
    showTerminalCollectionCreatedFeedback,
    hideTerminalCollectionCreatedFeedback,
    openCreateTerminalCollectionDialog,
    scripts
  } = useCodeStateStore();

  console.log('TerminalCollectionList: Received scripts:', scripts);
  console.log('TerminalCollectionList: Received terminal collections:', terminalCollections);
  console.log('TerminalCollectionList: isLoading:', isLoading);
  console.log('TerminalCollectionList: currentProjectRoot:', currentProjectRoot);

  // Helper function to get script names from scripts array
  const getScriptNamesFromScripts = (scriptsArray: any[]) => {
    console.log('TerminalCollectionList: scriptsArray:', scriptsArray);
    const scriptIds = scriptsArray.map(ref => ref.id);
    const scriptData = scripts.filter(script => scriptIds.includes(script.id));
    console.log('TerminalCollectionList: scriptData:', scriptData);
    const scriptNames = scriptData
      .map(script => <><b>{script.name}</b>: {script?.commands?.map((c: any) => <><br />{c.command}</>)}</>)
      .filter(Boolean);
    console.log('TerminalCollectionList: scriptNames:', scriptNames);
    return scriptNames;
  };

  // Hide feedback after 3 seconds
  useEffect(() => {
    if (showTerminalCollectionCreatedFeedback && newlyCreatedTerminalCollectionId) {
      const timer = setTimeout(() => {
        hideTerminalCollectionCreatedFeedback();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [showTerminalCollectionCreatedFeedback, newlyCreatedTerminalCollectionId, hideTerminalCollectionCreatedFeedback]);

  const handleCreateTerminalCollection = () => {
    openCreateTerminalCollectionDialog(currentProjectRoot || '');
  };

  const handleExecuteTerminalCollection = (id: string) => {
    onEvent({ type: 'EXECUTE_TERMINAL_COLLECTION', payload: { id } });
  };

  const handleDeleteTerminalCollection = (id: string) => {
    onEvent({ type: 'DELETE_TERMINAL_COLLECTION', payload: { id } });
  };

  const handleEditTerminalCollection = (id: string) => {
    onEvent({ type: 'EDIT_TERMINAL_COLLECTION', payload: { id } });
  };
  if (isLoading) {
    return (
      <div className="terminal-collection-list">
        <div className="terminal-collection-list-header">
          <h2>Terminal Collections</h2>
          <button className="btn-primary" disabled>
            Create Terminal Collection
          </button>
        </div>
        <div className="terminal-collection-list-content">
          <div className="terminal-collection-grid">
            {Array.from({ length: 3 }).map((_, index) => (
              <div className="skeleton-card" key={`terminal-collection-card-loading-${index}`}>
                <div className="skeleton-header">
                  <div className="skeleton-title"></div>
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
                </div>
                <div className="skeleton-footer">
                  <div className="skeleton-button"></div>
                  <div className="skeleton-button"></div>
                  <div className="skeleton-button"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="terminal-collection-list">
      <div className="terminal-collection-list-header">
        <h2>Terminal Collections</h2>
        <button
          className="btn-primary"
          onClick={handleCreateTerminalCollection}
        >
          Create Terminal Collection
        </button>
      </div>

      <div className="terminal-collection-list-content">
        {terminalCollections.length === 0 ? (
          <Card variant="outlined" className="empty-state">
            <CardContent>
              <div className="empty-state-content">
                <h3>No terminal collections found</h3>
                <p>Create your first terminal collection to manage multiple terminals.</p>
                <button
                  className="btn-primary"
                  onClick={handleCreateTerminalCollection}
                >
                  Create Your First Terminal Collection
                </button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="terminal-collection-grid">
            {terminalCollections.map((collection) => (
              <Card key={collection.id} variant="elevated" className={`terminal-collection-card ${collection.id === newlyCreatedTerminalCollectionId && showTerminalCollectionCreatedFeedback ? 'newly-created' : ''}`}>
                <CardHeader>
                  <div className="terminal-collection-card-header">
                    <div className="terminal-collection-title">
                      <h3>{collection.name}</h3>
                    </div>
                    <div className="terminal-collection-actions">
                      <button
                        className="btn-primary btn-sm"
                        onClick={() => handleExecuteTerminalCollection(collection.id)}
                      >
                        Execute
                      </button>
                      <button
                        className="btn-secondary btn-sm"
                        onClick={() => handleEditTerminalCollection(collection.id)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-ghost btn-sm"
                        onClick={() => handleDeleteTerminalCollection(collection.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="terminal-collection-details">
                    <div className="terminal-collection-detail">
                      <span className="detail-label">Root:</span>
                      <span className="detail-value">{collection.rootPath}</span>
                    </div>
                    <div className="terminal-collection-detail">
                      <span className="detail-label">Scripts:</span>
                      <span className="detail-value">
                        {collection.scripts.length > 0
                          ? getScriptNamesFromScripts(collection.scriptReferences)
                          : 'No scripts'
                        }
                      </span>
                    </div>
                    <div className="terminal-collection-detail">
                      <span className="detail-label">Lifecycle:</span>
                      <span className="detail-value">{collection.lifecycle.join(', ')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}