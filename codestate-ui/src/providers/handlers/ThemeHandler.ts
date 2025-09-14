import type { Theme } from '../DataProvider';

export class ThemeHandler {
  private onThemeChange?: (theme: Theme) => void;
  private currentTheme: Theme = 'dark';

  // Register handler
  setThemeChangeHandler(handler: (theme: Theme) => void): void {
    this.onThemeChange = handler;
  }

  // Handle theme events
  handleThemeChange(message: { payload: { theme: Theme } }): void {
    this.currentTheme = message.payload.theme;
    if (this.onThemeChange) {
      this.onThemeChange(this.currentTheme);
    }
  }

  // Get current theme
  getCurrentTheme(): Theme {
    return this.currentTheme;
  }

  // Clean up handlers
  destroy(): void {
    this.onThemeChange = undefined;
  }
}