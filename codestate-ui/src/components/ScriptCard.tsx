import { Card, CardHeader, CardContent } from './Card';
import type { Script } from '../types/session';
import './ScriptCard.css';

interface ScriptCardProps {
  script: Script;
  isNewlyCreated?: boolean;
}

export function ScriptCard({ script, isNewlyCreated = false }: ScriptCardProps) {
  const getExecutionMode = (): string => {
    return script.executionMode || 'same-terminal';
  };

  return (
    <Card
      variant="elevated"
      className={`script-card ${isNewlyCreated ? 'newly-created' : ''}`}
    >
      <CardHeader>
        <div className="script-card-header">
          <div className="script-title">
            <h3>{script.name}</h3>
          </div>
          <div className="script-actions">
            <button
              className="btn-primary btn-sm"
              data-action="run-script"
              data-script-id={script.id}
              title="Run script"
            >
              ▶️ Run
            </button>
            <button
              className="btn-ghost btn-sm"
              data-action="edit-script"
              data-script-id={script.id}
              title="Edit script"
            >
              ✏️
            </button>
            <button
              className="btn-ghost btn-sm"
              data-action="delete-script"
              data-script-id={script.id}
              title="Delete script"
            >
              🗑️
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="script-details">

          {/* Execution Mode */}
          <div className="script-detail">
            <span className="detail-label">Mode:</span>
            <span className="detail-value">{getExecutionMode()}</span>
          </div>

          {/* Script Commands */}
          <div className="script-detail">
            <span className="detail-label">Script Commands:</span>
            <span className="detail-value">
              {script.commands && script.commands.length > 0 ? (
                script.commands.map((cmd, index) => (
                  <span key={index}>
                    <b>{cmd.name}</b>: {cmd.command}
                    {index < (script.commands?.length || 0) - 1 ? ', ' : ''}
                    {index < (script.commands?.length || 0) - 1 ? <br /> : ''}
                  </span>
                ))
              ) : (
                '-'
              )}
            </span>
          </div>

          {/* Lifecycle */}
          <div className="script-detail">
            <span className="detail-label">Lifecycle:</span>
            <span className="detail-value">
              {script.lifecycle && script.lifecycle.length > 0
                ? script.lifecycle.join(', ')
                : '-'
              }
            </span>
          </div>

          {/* Close Terminal After Execution */}
          <div className="script-detail">
            <span className="detail-label">Close Terminal:</span>
            <span className="detail-value">
              {script.closeTerminalAfterExecution ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}