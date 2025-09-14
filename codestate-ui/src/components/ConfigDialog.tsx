import { useState, useEffect } from 'preact/hooks';
import { Dialog } from './Dialog';
import { useCodeStateStore } from '../store/codestateStore';
import type { DataProvider, Theme } from '../providers/DataProvider';
import './ConfigDialog.css';

interface ConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  provider: DataProvider;
}

interface Config {
  version: string;
  ide: string;
  storagePath: string;
  logger: LoggerConfig;
  experimental?: Record<string, boolean>;
  extensions?: Record<string, unknown>;
}

interface LoggerConfig {
  level: 'ERROR' | 'WARN' | 'LOG' | 'DEBUG';
  sinks: ('file' | 'console')[];
  filePath?: string;
}

export function ConfigDialog({
  isOpen,
  onClose,
  provider
}: ConfigDialogProps) {
  // Get config data from Zustand store
  const configDialog = useCodeStateStore((state) => state.configDialog);
  const propConfigData = configDialog.configData;
  const configDataError = configDialog.configDataError;
  const [formData, setFormData] = useState<Config>({
    version: '',
    ide: '',
    storagePath: '',
    logger: { level: 'LOG', sinks: ['console'] },
    extensions: {}
  });
  const [currentTheme, setCurrentTheme] = useState<Theme>('dark');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Pre-populate form when config data is available
  useEffect(() => {
    console.log('ConfigDialog: useEffect triggered with propConfigData', propConfigData);
    if (propConfigData) {
      console.log('ConfigDialog: Setting form data', propConfigData);
      setFormData(propConfigData);
      
      // Extract theme from extensions
      const theme = propConfigData.extensions?.theme as Theme || 'dark';
      setCurrentTheme(theme);
    }
  }, [propConfigData]);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    
    setIsUpdating(true);
    setUpdateError(null);

    try {
      // Include theme in extensions object
      const configWithTheme = {
        ...formData,
        extensions: {
          ...formData.extensions,
          theme: currentTheme
        }
      };
      
      // Send config update message
      provider.sendMessage('codestate.config.update', { config: configWithTheme });
    } catch (err) {
      console.error('Failed to update config:', err);
      setUpdateError('Failed to update config');
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    setFormData({
      version: '',
      ide: '',
      storagePath: '',
      logger: { level: 'LOG', sinks: ['console'] },
      extensions: {}
    });
    setIsUpdating(false);
    setUpdateError(null);
    onClose();
  };

  const updateFormData = (updates: Partial<Config>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const updateLogger = (updates: Partial<LoggerConfig>) => {
    setFormData(prev => ({
      ...prev,
      logger: { ...prev.logger, ...updates }
    }));
  };

  const toggleLoggerSink = (sink: 'file' | 'console') => {
    setFormData(prev => ({
      ...prev,
      logger: {
        ...prev.logger,
        sinks: prev.logger.sinks.includes(sink)
          ? prev.logger.sinks.filter(s => s !== sink)
          : [...prev.logger.sinks, sink]
      }
    }));
  };

  return (
    <Dialog
      isOpen={isOpen}
      title="Configuration Settings"
      onClose={handleClose}
      size="lg"
    >
      {configDataError ? (
        <div className="error-state">
          <p className="error-message">Failed to load configuration: {configDataError}</p>
          <button className="retry-button" onClick={onClose}>
            Close
          </button>
        </div>
      ) : !propConfigData ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading configuration...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="config-form">
          <div className="config-section">
            <h3>General Settings</h3>
            
            <div className="form-group">
              <label htmlFor="version" className="form-label">
                Version
              </label>
              <input
                id="version"
                type="text"
                className="form-input"
                value={formData.version}
                onInput={(e) => updateFormData({ version: (e.target as HTMLInputElement)?.value || '' })}
                placeholder="Configuration version"
                readOnly
              />
            </div>

            <div className="form-group">
              <label htmlFor="ide" className="form-label">
                IDE
              </label>
              <input
                id="ide"
                type="text"
                className="form-input"
                value={formData.ide}
                onInput={(e) => updateFormData({ ide: (e.target as HTMLInputElement)?.value || '' })}
                placeholder="Integrated Development Environment"
                readOnly
              />
            </div>

            <div className="form-group">
              <label htmlFor="storage-path" className="form-label">
                Storage Path
              </label>
              <input
                id="storage-path"
                type="text"
                className="form-input"
                value={formData.storagePath}
                onInput={(e) => updateFormData({ storagePath: (e.target as HTMLInputElement)?.value || '' })}
                placeholder="/path/to/storage"
              />
            </div>
          </div>

          <div className="config-section">
            <h3>Theme Settings</h3>
            
            <div className="form-group">
              <label htmlFor="theme-select" className="form-label">
                Theme
              </label>
              <select
                id="theme-select"
                className="form-select"
                value={currentTheme}
                onChange={(e) => setCurrentTheme((e.target as HTMLSelectElement)?.value as Theme)}
              >
                <option value="match-ide">Match IDE</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </div>

          <div className="config-section">
            <h3>Logger Settings</h3>
            
            <div className="form-group">
              <label htmlFor="log-level" className="form-label">
                Log Level
              </label>
              <select
                id="log-level"
                className="form-select"
                value={formData.logger.level}
                onChange={(e) => updateLogger({ level: (e.target as HTMLSelectElement)?.value as LoggerConfig['level'] })}
              >
                <option value="ERROR">ERROR</option>
                <option value="WARN">WARN</option>
                <option value="LOG">LOG</option>
                <option value="DEBUG">DEBUG</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Log Sinks</label>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.logger.sinks.includes('console')}
                    onChange={() => toggleLoggerSink('console')}
                    className="form-checkbox"
                  />
                  Console
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.logger.sinks.includes('file')}
                    onChange={() => toggleLoggerSink('file')}
                    className="form-checkbox"
                  />
                  File
                </label>
              </div>
            </div>

            {formData.logger.sinks.includes('file') && (
              <div className="form-group">
                <label htmlFor="log-file-path" className="form-label">
                  Log File Path
                </label>
                <input
                  id="log-file-path"
                  type="text"
                  className="form-input"
                  value={formData.logger.filePath || ''}
                  onInput={(e) => updateLogger({ filePath: (e.target as HTMLInputElement)?.value || '' })}
                  placeholder="/path/to/logfile.log"
                />
              </div>
            )}
          </div>

          {/* Error Display */}
          {updateError && (
            <div className="form-group">
              <div className="error-message">
                {updateError}
              </div>
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isUpdating}
            >
              {isUpdating ? 'Updating...' : 'Update Configuration'}
            </button>
          </div>
        </form>
      )}
    </Dialog>
  );
}