import { memo } from 'preact/compat';
import { useMemo } from 'preact/hooks';
import { Card, CardHeader, CardContent } from './Card';
import type { SessionCardProps } from '../types/session';

export const SessionCard = memo(function SessionCard({
  session,
  isNewlyCreated = false
}: SessionCardProps) {
  // Create a reusable date formatter
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }), []);

  const formatDate = (date: Date | string | undefined) => {
    if(!date) return '';
    
    // Convert string to Date if needed
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      console.error('Invalid date:', date);
      return 'Invalid date';
    }
    
    return dateFormatter.format(dateObj);
  };

  // Memoize expensive calculations
  const formattedCreatedDate = useMemo(() => 
    formatDate(session.createdAt), [session.createdAt, dateFormatter]
  );
  
  const formattedUpdatedDate = useMemo(() => 
    formatDate(session.updatedAt), [session.updatedAt, dateFormatter]
  );
  
  const projectName = useMemo(() => 
    session.projectRoot.split('/').pop() || session.projectRoot, 
    [session.projectRoot]
  );
  
  const gitStatus = useMemo(() => {
    if (session.git.isDirty) {
      return { status: 'dirty', text: 'Uncommitted changes', color: 'var(--destructive)' };
    }
    return { status: 'clean', text: 'Clean', color: 'var(--primary)' };
  }, [session.git.isDirty]);
  
  const activeFile = useMemo(() => 
    session.files.find(f => f.isActive)?.path.split('/').pop(), 
    [session.files]
  );

  return (
    <Card variant="elevated" className={`session-card ${isNewlyCreated ? 'newly-created' : ''}`}>
      <CardHeader>
        <div className="session-card-header">
          <div className="session-title">
            <h3>{session.name}</h3>
          </div>
          <div className="session-actions">
            <button 
              className="btn-ghost btn-sm"
              data-action="resume-session"
              data-session-id={session.id}
              title="Resume session"
            >
              ▶️ Resume
            </button>
            <button 
              className="btn-ghost btn-sm"
              data-action="edit-session"
              data-session-id={session.id}
              title="Edit session"
            >
              ✏️
            </button>
            <button 
              className="btn-ghost btn-sm"
              data-action="export-session"
              data-session-id={session.id}
              title="Export session"
            >
              📤
            </button>
            <button 
              className="btn-ghost btn-sm"
              data-action="delete-session"
              data-session-id={session.id}
              title="Delete session"
            >
              🗑️
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="session-details">
          {/* Project Path */}
          <div className="session-detail">
            <span className="detail-label">Project:</span>
            <span className="detail-value">{session.projectRoot}</span>
          </div>

          {/* Git Status */}
          <div className="session-detail">
            <span className="detail-label">Git:</span>
            <span 
              className="detail-value git-status"
              style={{ color: gitStatus.color }}
            >
              {session.git.branch} • {gitStatus.text}
            </span>
          </div>

          {/* Files */}
          <div className="session-detail">
            <span className="detail-label">Files:</span>
            <span className="detail-value">
              {session.files.length} file{session.files.length !== 1 ? 's' : ''}
              {activeFile && (
                <span className="active-file"> • Active: {activeFile}</span>
              )}
            </span>
          </div>

          {/* Scripts & Terminal Collections */}
          <div className="session-detail">
            <span className="detail-label">Resources:</span>
            <span className="detail-value">
              {session.scripts?.length || 0} script{(session.scripts?.length || 0) !== 1 ? 's' : ''} • 
              {session.terminalCollections?.length || 0} terminal collection{(session.terminalCollections?.length || 0) !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Tags */}
          <div className="session-detail">
            <span className="detail-label">Tags:</span>
            <div className="tags">
              {session.tags.length > 0 ? (
                session.tags.map((tag, index) => (
                  <span key={index} className="tag">
                    {tag}
                  </span>
                ))
              ) : (
                <span className="detail-value">-</span>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="session-detail">
            <span className="detail-label">Notes:</span>
            <span className="detail-value notes">{session.notes || '-'}</span>
          </div>

          {/* Timestamps */}
          <div className="session-timestamps">
            <div className="timestamp">
              <span className="timestamp-label">Created:</span>
              <span className="timestamp-value">{formattedCreatedDate}</span>
            </div>
            <div className="timestamp">
              <span className="timestamp-label">Updated:</span>
              <span className="timestamp-value">{formattedUpdatedDate}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});