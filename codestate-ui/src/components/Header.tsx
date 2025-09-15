import { memo } from 'preact/compat';
import './Header.css';

interface HeaderProps {
  onConfigClick: () => void;
}

export const Header = memo(function Header({ onConfigClick }: HeaderProps) {
  
  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-title">
          <h1>CodeState</h1>
        </div>
        
        <div className="header-actions">
          <button
            className="btn-secondary btn-sm header-config-button"
            onClick={onConfigClick}
            title="Configuration Settings"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 9.5C8.82843 9.5 9.5 8.82843 9.5 8C9.5 7.17157 8.82843 6.5 8 6.5C7.17157 6.5 6.5 7.17157 6.5 8C6.5 8.82843 7.17157 9.5 8 9.5Z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 1V2M8 14V15M15 8H14M2 8H1M12.364 3.636L11.657 4.343M4.343 11.657L3.636 12.364M12.364 12.364L11.657 11.657M4.343 4.343L3.636 3.636" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Config
          </button>
        </div>
      </div>
    </header>
  );
});