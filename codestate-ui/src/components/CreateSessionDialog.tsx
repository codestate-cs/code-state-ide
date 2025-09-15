import { useState, useEffect } from 'preact/hooks';
import { Dialog } from './Dialog';
import { useSessionStore, useScriptStore, useTerminalCollectionStore } from '../store/combinedStore';
import type { DataProvider } from '../providers/DataProvider';
import type { SessionWithFullData } from '../types/session';
import './CreateSessionDialog.css';

interface CreateSessionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  provider: DataProvider;
  sessionData?: any | null;
  sessionDataError?: string | null;
  editSession?: SessionWithFullData | null;
}

interface CreateSessionData {
  name: string;
  projectRoot: string;
  tags: string[];
  notes: string;
  selectedScripts: string[];
  selectedTerminalCollections: string[];
}

type DialogStep = 'basic' | 'scripts' | 'terminal-collections' | 'review';

export function CreateSessionDialog({
  isOpen,
  onClose,
  provider,
  sessionData: propSessionData,
  sessionDataError,
  editSession
}: CreateSessionDialogProps) {
  console.log('propSessionData', propSessionData);
  const [currentStep, setCurrentStep] = useState<DialogStep>('basic');
  const [formData, setFormData] = useState<CreateSessionData>({
    name: '',
    projectRoot: '',
    tags: [],
    notes: '',
    selectedScripts: [],
    selectedTerminalCollections: []
  });
  const [tagInput, setTagInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Get Zustand store data and actions
  const scripts = useScriptStore((state) => state.scripts);
  const terminalCollections = useTerminalCollectionStore((state) => state.terminalCollections);
  const setTempSessionData = useSessionStore((state) => state.setTempSessionData);

  // Pre-populate form when session data is available
  useEffect(() => {
    if (propSessionData) {
      setFormData(prev => ({
        ...prev,
        projectRoot: propSessionData.projectRoot,
        name: propSessionData.name || prev.name
      }));
    }
  }, [propSessionData]);

  // Pre-populate form for edit mode
  useEffect(() => {
    if (editSession) {
      setFormData({
        name: editSession.name,
        projectRoot: editSession.projectRoot,
        tags: editSession.tags || [],
        notes: editSession.notes || '',
        selectedScripts: editSession.scripts || [],
        selectedTerminalCollections: editSession.terminalCollections || []
      });
    }
  }, [editSession]);

  // Step navigation functions
  const nextStep = () => {
    const steps: DialogStep[] = ['basic', 'scripts', 'terminal-collections', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const steps: DialogStep[] = ['basic', 'scripts', 'terminal-collections', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 'basic':
        return formData.name.trim() !== '';
      case 'scripts':
      case 'terminal-collections':
        return true; // These steps are optional
      case 'review':
        return false; // This is the final step
      default:
        return false;
    }
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    
    // Only allow submission on the review step
    if (currentStep !== 'review') {
      return;
    }
    
    if (!formData.name.trim()) {
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      // Merge the collected data with user input
      const completeSessionData = {
        ...propSessionData,
        name: formData.name,
        tags: formData.tags,
        notes: formData.notes,
        scripts: formData.selectedScripts,
        terminalCollections: formData.selectedTerminalCollections,
        updatedAt: new Date()
      };

      // Store temp session data for immediate UI update
      const tempSession = {
        id: editSession?.id || '', // Will be filled when response comes back
        name: formData.name,
        projectRoot: propSessionData?.projectRoot || editSession?.projectRoot || '',
        createdAt: editSession?.createdAt || new Date(),
        updatedAt: new Date(),
        tags: formData.tags,
        notes: formData.notes,
        files: propSessionData?.files || editSession?.files || [],
        git: propSessionData?.git || editSession?.git || { branch: '', commit: '', isDirty: false },
        extensions: propSessionData?.extensions || editSession?.extensions || {},
        terminalCommands: propSessionData?.terminalCommands || editSession?.terminalCommands || [],
        terminalCollections: formData.selectedTerminalCollections,
        scripts: formData.selectedScripts
      };
      
      setTempSessionData(tempSession);

      // Send session creation/update message
      if (editSession) {
        // For updates, send only the changed data
        provider.sendMessage('codestate.session.update', { 
          id: editSession.id,
          updates: {
            name: formData.name,
            tags: formData.tags,
            notes: formData.notes,
            scripts: formData.selectedScripts,
            terminalCollections: formData.selectedTerminalCollections
          }
        });
      } else {
        // For creation, send the complete session data
        provider.sendMessage('codestate.session.create', { 
          sessionData: completeSessionData
        });
      }
    } catch (err) {
      console.error('Failed to create/update session:', err);
      setCreateError('Failed to create/update session');
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      projectRoot: '',
      tags: [],
      notes: '',
      selectedScripts: [],
      selectedTerminalCollections: []
    });
    setTagInput('');
    setCurrentStep('basic');
    setIsCreating(false);
    setCreateError(null);
    onClose();
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  // Script selection helpers
  const toggleScript = (scriptId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedScripts: prev.selectedScripts.includes(scriptId)
        ? prev.selectedScripts.filter(id => id !== scriptId)
        : [...prev.selectedScripts, scriptId]
    }));
  };

  const isScriptSelected = (scriptId: string) => {
    return formData.selectedScripts.includes(scriptId);
  };

  // Terminal collection selection helpers
  const toggleTerminalCollection = (terminalCollectionId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedTerminalCollections: prev.selectedTerminalCollections.includes(terminalCollectionId)
        ? prev.selectedTerminalCollections.filter(id => id !== terminalCollectionId)
        : [...prev.selectedTerminalCollections, terminalCollectionId]
    }));
  };

  const isTerminalCollectionSelected = (terminalCollectionId: string) => {
    return formData.selectedTerminalCollections.includes(terminalCollectionId);
  };

  const renderStepIndicator = () => {
    const steps = [
      { key: 'basic', label: 'Basic Details' },
      { key: 'scripts', label: 'Scripts' },
      { key: 'terminal-collections', label: 'Terminal Collections' },
      { key: 'review', label: 'Review' }
    ];

    const currentStepIndex = steps.findIndex(step => step.key === currentStep);

    return (
      <div className="step-indicator">
        {steps.map((step, index) => (
          <div key={step.key} className={`step ${currentStep === step.key ? 'active' : ''} ${currentStepIndex > index ? 'completed' : ''}`}>
            <div className="step-number">{index + 1}</div>
            <div className="step-label">{step.label}</div>
          </div>
        ))}
      </div>
    );
  };

  const renderBasicStep = () => (
    <div className="step-content">
      <div className="form-group">
        <label htmlFor="session-name" className="form-label">
          Session Name *
        </label>
        <input
          id="session-name"
          type="text"
          className="form-input"
          value={formData.name}
          onInput={(e) => setFormData(prev => ({ ...prev, name: (e.target as HTMLInputElement)?.value || '' }))}
          placeholder="Enter session name"
          required
          autoFocus
        />
      </div>

      <div className="form-group">
        <label htmlFor="project-root" className="form-label">
          Project Root
        </label>
        <input
          id="project-root"
          type="text"
          className="form-input"
          value={formData.projectRoot}
          onInput={(e) => setFormData(prev => ({ ...prev, projectRoot: (e.target as HTMLInputElement)?.value || '' }))}
          placeholder="/path/to/your/project"
          readOnly
        />
      </div>

      {/* Git Information Display */}
      {(propSessionData?.git || editSession?.git) && (
        <div className="form-group">
          <label className="form-label">Git Information</label>
          <div className="git-info">
            <div className="git-info-item">
              <span className="git-label">Branch:</span>
              <span className="git-value">{(propSessionData?.git || editSession?.git)?.branch}</span>
            </div>
            <div className="git-info-item">
              <span className="git-label">Commit:</span>
              <span className="git-value">{(propSessionData?.git || editSession?.git)?.commit}</span>
            </div>
            <div className="git-info-item">
              <span className="git-label">Status:</span>
              <span className={`git-value ${(propSessionData?.git || editSession?.git)?.isDirty ? 'dirty' : 'clean'}`}>
                {(propSessionData?.git || editSession?.git)?.isDirty ? 'Uncommitted changes' : 'Clean'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Files Information Display */}
      {((propSessionData?.files && propSessionData.files.length > 0) || (editSession?.files && editSession.files.length > 0)) && (
        <div className="form-group">
          <label className="form-label">Open Files ({(propSessionData?.files || editSession?.files || []).length})</label>
          <div className="files-list">
            {(propSessionData?.files || editSession?.files || []).slice(0, 5).map((file: any, index: number) => (
              <div key={index} className="file-item">
                <span className="file-path">{file.path}</span>
                {file.cursor && (
                  <span className="file-cursor">
                    Line {file.cursor.line}, Col {file.cursor.column}
                  </span>
                )}
              </div>
            ))}
            {(propSessionData?.files || editSession?.files || []).length > 5 && (
              <div className="file-item more-files">
                +{(propSessionData?.files || editSession?.files || []).length - 5} more files
              </div>
            )}
          </div>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="tags" className="form-label">
          Tags
        </label>
        <div className="tag-input-container">
          <input
            id="tags"
            type="text"
            className="form-input"
            value={tagInput}
            onInput={(e) => setTagInput((e.target as HTMLInputElement)?.value || '')}
            onKeyPress={handleKeyPress}
            placeholder="Add tags (press Enter to add)"
          />
          <button
            type="button"
            className="btn-secondary btn-sm"
            onClick={addTag}
          >
            Add
          </button>
        </div>
        {formData.tags.length > 0 && (
          <div className="tag-list">
            {formData.tags.map((tag, index) => (
              <span key={index} className="tag">
                {tag}
                <button
                  type="button"
                  className="tag-remove"
                  onClick={() => removeTag(tag)}
                  aria-label={`Remove ${tag} tag`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="notes" className="form-label">
          Notes
        </label>
        <textarea
          id="notes"
          className="form-textarea"
          value={formData.notes}
          onInput={(e) => setFormData(prev => ({ ...prev, notes: (e.target as HTMLTextAreaElement)?.value || '' }))}
          placeholder="Add any notes about this session"
          rows={3}
        />
      </div>
    </div>
  );

  const renderScriptsStep = () => (
    <div className="step-content">
      <div className="form-group">
        <label className="form-label">Select Scripts</label>
        <p className="step-description">Choose which scripts to include in this session.</p>
        {scripts.length === 0 ? (
          <div className="empty-state">
            <p>No scripts available. Create scripts first to include them in sessions.</p>
          </div>
        ) : (
          <div className="selection-list">
            {scripts.map((script) => (
              <div key={script.id} className="selection-item">
                <label className="selection-label">
                  <input
                    type="checkbox"
                    checked={isScriptSelected(script.id)}
                    onChange={() => toggleScript(script.id)}
                    className="selection-checkbox"
                  />
                  <div className="selection-content">
                    <div className="selection-title">{script.name}</div>
                    <div className="selection-details">
                      <span className="selection-path">{script.rootPath}</span>
                      {script.lifecycle && script.lifecycle.length > 0 && (
                        <span className="selection-lifecycle">
                          Lifecycle: {script.lifecycle.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderTerminalCollectionsStep = () => (
    <div className="step-content">
      <div className="form-group">
        <label className="form-label">Select Terminal Collections</label>
        <p className="step-description">Choose which terminal collections to include in this session.</p>
        {terminalCollections.length === 0 ? (
          <div className="empty-state">
            <p>No terminal collections available. Create terminal collections first to include them in sessions.</p>
          </div>
        ) : (
          <div className="selection-list">
            {terminalCollections.map((terminalCollection) => (
              <div key={terminalCollection.id} className="selection-item">
                <label className="selection-label">
                  <input
                    type="checkbox"
                    checked={isTerminalCollectionSelected(terminalCollection.id)}
                    onChange={() => toggleTerminalCollection(terminalCollection.id)}
                    className="selection-checkbox"
                  />
                  <div className="selection-content">
                    <div className="selection-title">{terminalCollection.name}</div>
                    <div className="selection-details">
                      <span className="selection-path">{terminalCollection.rootPath}</span>
                      {terminalCollection.lifecycle && terminalCollection.lifecycle.length > 0 && (
                        <span className="selection-lifecycle">
                          Lifecycle: {terminalCollection.lifecycle.join(', ')}
                        </span>
                      )}
                      {terminalCollection.scripts && terminalCollection.scripts.length > 0 && (
                        <span className="selection-scripts">
                          Scripts: {terminalCollection.scripts.length}
                        </span>
                      )}
                    </div>
                  </div>
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="step-content">
      <div className="review-section">
        <h3>Session Details</h3>
        <div className="review-item">
          <strong>Name:</strong> {formData.name}
        </div>
        <div className="review-item">
          <strong>Project Root:</strong> {formData.projectRoot}
        </div>
        {formData.tags.length > 0 && (
          <div className="review-item">
            <strong>Tags:</strong> {formData.tags.join(', ')}
          </div>
        )}
        {formData.notes && (
          <div className="review-item">
            <strong>Notes:</strong> {formData.notes}
          </div>
        )}
      </div>

      {formData.selectedScripts.length > 0 && (
        <div className="review-section">
          <h3>Selected Scripts ({formData.selectedScripts.length})</h3>
          {formData.selectedScripts.map(scriptId => {
            const script = scripts.find(s => s.id === scriptId);
            return script ? (
              <div key={scriptId} className="review-item">
                <strong>{script.name}</strong> - {script.rootPath}
              </div>
            ) : null;
          })}
        </div>
      )}

      {formData.selectedTerminalCollections.length > 0 && (
        <div className="review-section">
          <h3>Selected Terminal Collections ({formData.selectedTerminalCollections.length})</h3>
          {formData.selectedTerminalCollections.map(terminalCollectionId => {
            const terminalCollection = terminalCollections.find(tc => tc.id === terminalCollectionId);
            return terminalCollection ? (
              <div key={terminalCollectionId} className="review-item">
                <strong>{terminalCollection.name}</strong> - {terminalCollection.rootPath}
              </div>
            ) : null;
          })}
        </div>
      )}

      {/* Error Display */}
      {createError && (
        <div className="form-group">
          <div className="error-message">
            {createError}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Dialog
      isOpen={isOpen}
      title={editSession ? "Edit Session" : "Create New Session"}
      onClose={handleClose}
      size="lg"
    >
      {sessionDataError ? (
        <div className="error-state">
          <p className="error-message">Failed to collect workspace data: {sessionDataError}</p>
          <button className="retry-button" onClick={onClose}>
            Close
          </button>
        </div>
      ) : !propSessionData && !editSession ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Collecting workspace data...</p>
        </div>
      ) : (
        <div className="create-session-container">
          <div className="create-session-form">
            {renderStepIndicator()}
            
            <form onSubmit={handleSubmit} onKeyDown={(e) => {
              if (e.key === 'Enter' && currentStep !== 'review') {
                e.preventDefault();
              }
            }} className="step-form">
              <div className="step-content-scrollable">
                {currentStep === 'basic' && renderBasicStep()}
                {currentStep === 'scripts' && renderScriptsStep()}
                {currentStep === 'terminal-collections' && renderTerminalCollectionsStep()}
                {currentStep === 'review' && renderReviewStep()}
              </div>
            </form>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleClose}
            >
              Cancel
            </button>
            
            {currentStep !== 'basic' && (
              <button
                type="button"
                className="btn-secondary"
                onClick={prevStep}
              >
                Previous
              </button>
            )}
            
            {currentStep !== 'review' ? (
              <button
                type="button"
                className="btn-primary"
                onClick={nextStep}
                disabled={!canProceedToNext()}
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                className="btn-primary"
                disabled={!formData.name.trim() || isCreating}
                onClick={handleSubmit}
              >
                {isCreating ? (editSession ? 'Updating...' : 'Creating...') : (editSession ? 'Update Session' : 'Create Session')}
              </button>
            )}
          </div>
        </div>
      )}
    </Dialog>
  );
}