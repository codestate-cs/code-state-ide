import './ThemeSwitcher.css';

type Theme = 'match-ide' | 'light' | 'dark';

interface ThemeSwitcherProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  className?: string;
  compact?: boolean;
}

export function ThemeSwitcher({ currentTheme, onThemeChange, className = '', compact = false }: ThemeSwitcherProps) {
  const themes: { id: Theme; label: string; description: string }[] = [
    { id: 'match-ide', label: 'Match IDE', description: 'Inherits VS Code theme' },
    { id: 'light', label: 'Light', description: 'Soft grays and delicate accents' },
    { id: 'dark', label: 'Dark', description: 'Codestate.dev inspired' }
  ];

  const themeClasses = [
    'theme-switcher',
    compact ? 'compact' : '',
    className
  ].filter(Boolean).join(' ');

  if (compact) {
    return (
      <div className={themeClasses}>
        <select 
          className="theme-select"
          value={currentTheme}
          onChange={(e) => onThemeChange(e?.target?.value || 'match-ide' as Theme)}
        >
          {themes.map((theme) => (
            <option key={theme.id} value={theme.id} title={theme.description}>
              {theme.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className={themeClasses}>
      <div className="theme-switcher-label">Theme</div>
      <div className="theme-switcher-options">
        {themes.map((theme) => (
          <button
            key={theme.id}
            className={`theme-option ${currentTheme === theme.id ? 'active' : ''}`}
            onClick={() => onThemeChange(theme.id)}
            title={theme.description}
          >
            <div className="theme-option-indicator">
              <div className={`theme-preview theme-preview-${theme.id}`}></div>
            </div>
            <div className="theme-option-text">
              <div className="theme-option-label">{theme.label}</div>
              <div className="theme-option-description">{theme.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}