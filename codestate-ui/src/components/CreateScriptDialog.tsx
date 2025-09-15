import { useState, useEffect } from 'preact/hooks';
import { Dialog } from './Dialog';
import { useScriptStore } from '../store/combinedStore';
import type { DataProvider } from '../providers/DataProvider';
import './CreateScriptDialog.css';
import type { Script } from '../types/session';

interface CreateScriptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  provider: DataProvider;
  rootPath?: string;
  editScript?: Script | null;
}

interface CreateScriptData {
  name: string;
  rootPath: string;
  commands: Array<{
    command: string;
    name: string;
    priority: number;
  }>;
  lifecycle: string[];
  executionMode: 'same-terminal' | 'new-terminals';
  closeTerminalAfterExecution: boolean;
}

export function CreateScriptDialog({
  isOpen,
  onClose,
  provider,
  rootPath = '',
  editScript = null
}: CreateScriptDialogProps) {
  const [formData, setFormData] = useState<CreateScriptData>({
    name: '',
    rootPath: rootPath,
    commands: [{ command: '', name: '', priority: 1 }],
    lifecycle: ['open'],
    executionMode: 'new-terminals',
    closeTerminalAfterExecution: false
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Get Zustand store actions
  const setTempScriptData = useScriptStore((state) => state.setTempScriptData);
  const setCurrentScript = useScriptStore((state) => state.setCurrentScript);

  // Pre-fill form when editing
  useEffect(() => {
    if (editScript) {
      setFormData({
        name: editScript.name,
        rootPath: editScript.rootPath,
        commands: editScript.commands && editScript.commands.length > 0 
          ? editScript.commands 
          : [{ command: '', name: '', priority: 1 }],
        lifecycle: editScript.lifecycle || ['open'],
        executionMode: editScript.executionMode || 'new-terminals',
        closeTerminalAfterExecution: editScript.closeTerminalAfterExecution || false
      });
    } else {
      // Reset form for create mode
      setFormData({
        name: '',
        rootPath: rootPath,
        commands: [{ command: '', name: '', priority: 1 }],
        lifecycle: ['open'],
        executionMode: 'new-terminals',
        closeTerminalAfterExecution: false
      });
    }
  }, [editScript, rootPath]);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setCreateError('Script name is required');
      return;
    }

    if (!formData.rootPath.trim()) {
      setCreateError('Root path is required');
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      // Store temp script data for immediate UI update
      const tempScript = {
        id: '', // Will be filled when response comes back
        name: formData.name,
        rootPath: formData.rootPath,
        commands: formData.commands.filter(cmd => cmd.command.trim() && cmd.name.trim()),
        lifecycle: formData.lifecycle as ('open' | 'resume' | 'none')[],
        executionMode: formData.executionMode,
        closeTerminalAfterExecution: formData.closeTerminalAfterExecution
      };
      
      setTempScriptData(tempScript);

      // Send script creation or update message
      if (editScript) {
        // Update the current script with the new form data for the response handler
        const updatedScript = {
          ...editScript,
          name: formData.name,
          rootPath: formData.rootPath,
          commands: formData.commands.filter(cmd => cmd.command.trim() && cmd.name.trim()),
          lifecycle: formData.lifecycle as ('open' | 'resume' | 'none')[],
          executionMode: formData.executionMode,
          closeTerminalAfterExecution: formData.closeTerminalAfterExecution
        };
        console.log('CreateScriptDialog: Setting current script to:', updatedScript);
        setCurrentScript(updatedScript);
        
        provider.sendMessage('codestate.script.update', { 
          id: editScript.id,
          scriptData: formData 
        });
      } else {
        provider.sendMessage('codestate.script.create', { scriptData: formData });
      }
    } catch (err) {
      console.error('Failed to create script:', err);
      setCreateError('Failed to create script');
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      rootPath: rootPath,
      commands: [{ command: '', name: '', priority: 1 }],
      lifecycle: ['open'],
      executionMode: 'same-terminal',
      closeTerminalAfterExecution: false
    });
    setCreateError(null);
    setIsCreating(false);
    onClose();
  };

  const addCommand = () => {
    setFormData(prev => ({
      ...prev,
      commands: [...prev.commands, { command: '', name: '', priority: prev.commands.length + 1 }]
    }));
  };

  const removeCommand = (index: number) => {
    setFormData(prev => ({
      ...prev,
      commands: prev.commands.filter((_, i) => i !== index)
    }));
  };

  const updateCommand = (index: number, field: 'command' | 'name' | 'priority', value: string | number) => {
    setFormData(prev => ({
      ...prev,
      commands: prev.commands.map((cmd, i) => 
        i === index ? { ...cmd, [field]: value } : cmd
      )
    }));
  };

  const toggleLifecycle = (lifecycle: string) => {
    setFormData(prev => ({
      ...prev,
      lifecycle: prev.lifecycle.includes(lifecycle)
        ? prev.lifecycle.filter(l => l !== lifecycle)
        : [...prev.lifecycle, lifecycle]
    }));
  };

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} title={editScript ? "Edit Script" : "Create Script"}>
      <div className="create-script-container">
        <form onSubmit={handleSubmit} className="create-script-form">
          <div className="form-content">
            <div className="form-group">
              <label htmlFor="script-name">Script Name *</label>
              <input
                id="script-name"
                type="text"
                value={formData.name}
                onInput={(e) => setFormData(prev => ({ ...prev, name: (e.target as HTMLInputElement).value }))}
                placeholder="Enter script name"
                required
                disabled={isCreating}
              />
            </div>

            <div className="form-group">
              <label htmlFor="root-path">Root Path *</label>
              <input
                id="root-path"
                type="text"
                value={formData.rootPath}
                onInput={(e) => setFormData(prev => ({ ...prev, rootPath: (e.target as HTMLInputElement).value }))}
                placeholder="Enter root path"
                required
                disabled={isCreating}
              />
            </div>


            <div className="form-group">
              <label>Commands</label>
              <div className="commands-section">
                {formData.commands.map((cmd, index) => (
                  <div key={index} className="command-row">
                    <input
                      type="text"
                      value={cmd.name}
                      onInput={(e) => updateCommand(index, 'name', (e.target as HTMLInputElement).value)}
                      placeholder="Command name"
                      disabled={isCreating}
                    />
                    <input
                      type="text"
                      value={cmd.command}
                      onInput={(e) => updateCommand(index, 'command', (e.target as HTMLInputElement).value)}
                      placeholder="Command"
                      disabled={isCreating}
                    />
                    <input
                      type="number"
                      value={cmd.priority}
                      onInput={(e) => updateCommand(index, 'priority', parseInt((e.target as HTMLInputElement).value) || 1)}
                      placeholder="Priority"
                      min="1"
                      disabled={isCreating}
                    />
                    <button
                      type="button"
                      onClick={() => removeCommand(index)}
                      disabled={isCreating || formData.commands.length === 1}
                      className="btn-remove"
                      title="Remove command"
                    >
                      ❌
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addCommand}
                  disabled={isCreating}
                  className="btn-add-command"
                >
                  Add Command
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Lifecycle Events</label>
              <div className="lifecycle-options">
                {['open', 'resume', 'none'].map(lifecycle => (
                  <label key={lifecycle} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.lifecycle.includes(lifecycle)}
                      onChange={() => toggleLifecycle(lifecycle)}
                      disabled={isCreating}
                    />
                    {lifecycle.charAt(0).toUpperCase() + lifecycle.slice(1)}
                  </label>
                ))}
              </div>
            </div>


            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.closeTerminalAfterExecution}
                  onChange={(e) => setFormData(prev => ({ ...prev, closeTerminalAfterExecution: (e.target as HTMLInputElement).checked }))}
                  disabled={isCreating}
                />
                Close Terminal After Execution
              </label>
            </div>

            {createError && (
              <div className="error-message">
                {createError}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={handleClose}
              disabled={isCreating}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || !formData.name.trim() || !formData.rootPath.trim()}
              className="btn-primary"
            >
              {isCreating ? (editScript ? 'Updating...' : 'Creating...') : (editScript ? 'Update Script' : 'Create Script')}
            </button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}