import { useCodeStateStore } from '../store/codestateStore';

export class ThemeManager {
  private store = useCodeStateStore.getState();
  private currentTheme: string = 'dark';

  // Handle theme change
  handleThemeChange(theme: string): void {
    console.log('ThemeManager: Theme changed to', theme);
    this.currentTheme = theme;
    
    // Update the DOM immediately
    document.documentElement.setAttribute('data-theme', theme);
    
    // Dispatch custom event for components that need to react to theme changes
    window.dispatchEvent(new CustomEvent('theme-changed', {
      detail: { theme },
      bubbles: true
    }));
  }

  // Get current theme
  getCurrentTheme(): string {
    return this.currentTheme;
  }
}