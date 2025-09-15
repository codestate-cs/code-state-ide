import { useState, useEffect } from 'preact/hooks';
import { Dialog } from './Dialog';
import { Accordion } from './Accordion';
import { useScriptStore, useTerminalCollectionStore } from '../store/combinedStore';
import type { TerminalCollectionWithScripts, Script } from '../types/session';
import type { DataProvider } from '../providers/DataProvider';
import './CreateTerminalCollectionDialog.css';

interface CreateTerminalCollectionData {
  name: string;
  rootPath: string;
  lifecycle: string[];
  scriptReferences: { id: string; rootPath: string }[];
  closeTerminalAfterExecution: boolean;
}

interface CreateTerminalCollectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  rootPath?: string;
  editTerminalCollection?: TerminalCollectionWithScripts | null;
  provider: DataProvider;
}

export function CreateTerminalCollectionDialog({
  isOpen,
  onClose,
  rootPath,
  editTerminalCollection,
  provider
}: CreateTerminalCollectionDialogProps) {
  const { scripts } = useScriptStore();
  const { setCurrentTerminalCollection, setTempTerminalCollectionData } = useTerminalCollectionStore();
  
  const [formData, setFormData] = useState<CreateTerminalCollectionData>({
    name: '',
    rootPath: rootPath || '',
    lifecycle: ['open'],
    scriptReferences: [],
    closeTerminalAfterExecution: false
  });
  const [error, setError] = useState<string | null>(null);

  // Pre-fill form data if editing
  useEffect(() => {
    if (editTerminalCollection) {
      setFormData({
        name: editTerminalCollection.name,
        rootPath: editTerminalCollection.rootPath,
        lifecycle: editTerminalCollection.lifecycle,
        scriptReferences: editTerminalCollection.scriptReferences.map(script => ({
          id: script.id,
          rootPath: script.rootPath
        })),
        closeTerminalAfterExecution: editTerminalCollection.closeTerminalAfterExecution || false
      });
    } else {
      // Reset form for creation
      setFormData({
        name: '',
        rootPath: rootPath || '',
        lifecycle: ['open'],
        scriptReferences: [],
        closeTerminalAfterExecution: false
      });
    }
  }, [editTerminalCollection, rootPath]);

  const handleInputChange = (field: keyof CreateTerminalCollectionData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null); // Clear error when user makes changes
  };

  const handleScriptToggle = (script: Script) => {
    const scriptRef = { id: script.id, rootPath: script.rootPath };
    const isSelected = formData.scriptReferences.some(ref => ref.id === script.id);
    
    if (isSelected) {
      setFormData(prev => ({
        ...prev,
        scriptReferences: prev.scriptReferences.filter(ref => ref.id !== script.id)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        scriptReferences: [...prev.scriptReferences, scriptRef]
      }));
    }
    setError(null); // Clear error when user makes changes
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    setError(null); // Clear any previous errors
    
    if (!formData.name.trim()) {
      setError('Please enter a name for the terminal collection.');
      return;
    }

    // Check if at least one script is selected
    if (formData.scriptReferences.length === 0) {
      setError('Please select at least one script for the terminal collection.');
      return;
    }

    // Send terminal collection creation or update message
    if (editTerminalCollection) {
      // Update the current terminal collection with the new form data for the response handler
      const updatedTerminalCollection = {
        ...editTerminalCollection,
        name: formData.name,
        rootPath: formData.rootPath,
        lifecycle: formData.lifecycle as ('open' | 'resume' | 'none')[],
        scriptReferences: formData.scriptReferences,
        closeTerminalAfterExecution: formData.closeTerminalAfterExecution
      };
      console.log('CreateTerminalCollectionDialog: Setting current terminal collection to:', updatedTerminalCollection);
      setCurrentTerminalCollection(updatedTerminalCollection);
      
      provider.sendMessage('codestate.terminal-collection.update', { 
        id: editTerminalCollection.id,
        terminalCollectionData: formData 
      });
    } else {
      // Store temp terminal collection data for immediate UI update
      const tempTerminalCollection = {
        id: '', // Will be filled when response comes back
        name: formData.name,
        rootPath: formData.rootPath,
        lifecycle: formData.lifecycle as ('open' | 'resume' | 'none')[],
        scriptReferences: formData.scriptReferences,
        closeTerminalAfterExecution: formData.closeTerminalAfterExecution,
        scripts: [] // Will be populated from scriptReferences
      };
      
      setTempTerminalCollectionData(tempTerminalCollection);
      
      provider.sendMessage('codestate.terminal-collection.create', { terminalCollectionData: formData });
    }
  };

  // Group scripts by root path
  const scriptGroups = scripts.reduce((groups, script) => {
    const rootPath = script.rootPath;
    if (!groups[rootPath]) {
      groups[rootPath] = [];
    }
    groups[rootPath].push(script);
    return groups;
  }, {} as Record<string, Script[]>);

  const groupEntries = Object.entries(scriptGroups);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={editTerminalCollection ? 'Edit Terminal Collection' : 'Create Terminal Collection'}
    >
      <form onSubmit={handleSubmit} className="create-terminal-collection-form">
        {error && (
          <div className="error-message" style={{ color: 'red', marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#ffe6e6', border: '1px solid #ff9999', borderRadius: '4px' }}>
            {error}
          </div>
        )}
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onInput={(e) => handleInputChange('name', (e.target as HTMLInputElement).value)}
            placeholder="Enter terminal collection name"
            required
            className="terminal-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="rootPath">Root Path</label>
          <input
            id="rootPath"
            type="text"
            value={formData.rootPath}
            onInput={(e) => handleInputChange('rootPath', (e.target as HTMLInputElement).value)}
            placeholder="Enter root path"
            required
            className="terminal-input"
          />
        </div>

        <div className="form-group">
          <label>Lifecycle Events</label>
          <div className="checkbox-group">
            {['open', 'resume', 'none'].map(event => (
              <label key={event} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.lifecycle.includes(event)}
                  onChange={(e) => {
                    if (e.currentTarget.checked) {
                      handleInputChange('lifecycle', [...formData.lifecycle, event]);
                    } else {
                      handleInputChange('lifecycle', formData.lifecycle.filter(l => l !== event));
                    }
                  }}
                  className="terminal-checkbox"
                />
                <span>{event}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Script References</label>
          <div className="script-selection">
            {groupEntries.length === 0 ? (
              <p className="no-scripts">No scripts available</p>
            ) : (
              <Accordion
                items={groupEntries.map(([rootPath, groupScripts]) => {
                  const projectName = rootPath.split('/').pop() || rootPath;
                  
                  return {
                    id: `script-group-${rootPath}`,
                    defaultOpen: rootPath === formData.rootPath, // Open if matches current root path
                    title: (
                      <div className="accordion-title-content">
                        <span className="project-name">{projectName}</span>
                        <span className="script-count">({groupScripts.length} script{groupScripts.length !== 1 ? 's' : ''})</span>
                        <span className="accordion-title-path">{rootPath}</span>
                      </div>
                    ),
                    content: (
                      <div className="script-group-content">
                        {groupScripts.map(script => (
                          <label key={script.id} className="checkbox-label script-item">
                            <input
                              type="checkbox"
                              checked={formData.scriptReferences.some(ref => ref.id === script.id)}
                              onChange={() => handleScriptToggle(script)}
                              className="terminal-checkbox"
                            />
                            <span>{script.name}</span>
                          </label>
                        ))}
                      </div>
                    )
                  };
                })}
              />
            )}
          </div>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.closeTerminalAfterExecution}
              onChange={(e) => handleInputChange('closeTerminalAfterExecution', e.currentTarget.checked)}
              className="terminal-checkbox"
            />
            <span>Close terminal after execution</span>
          </label>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            {editTerminalCollection ? 'Update Terminal Collection' : 'Create Terminal Collection'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}