import { render } from 'preact';
import './index.css';
import { App } from './app';
import { VSCodeProvider } from './providers/VSCodeProvider';

// Web Component without Shadow DOM to preserve CSS variable inheritance
class CodeStateUI extends HTMLElement {
  private appContainer: HTMLElement | null = null;
  private currentTheme: string = 'dark';

  constructor() {
    super();
    this.initializeComponent();
  }

  private initializeComponent() {
    // Create container for the app
    this.appContainer = document.createElement('div');
    this.appContainer.id = 'codesate-ui-root';
    this.appendChild(this.appContainer);

    // Initialize with default theme
    this.setTheme(this.currentTheme);
  }

  connectedCallback() {
    if (this.appContainer) {
      // Create VS Code provider and render the Preact app
      const provider = new VSCodeProvider();
      render(<App provider={provider} />, this.appContainer);
    }
  }

  disconnectedCallback() {
    // Cleanup if needed
    if (this.appContainer) {
      this.appContainer.innerHTML = '';
    }
  }

  // Public API methods for VS Code extension
  setTheme(theme: string) {
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    
    // Dispatch custom event for theme change
    this.dispatchEvent(new CustomEvent('theme-changed', {
      detail: { theme },
      bubbles: true
    }));
  }

  getTheme(): string {
    return this.currentTheme;
  }

  // Method to update data from VS Code extension
  updateData(data: any) {
    this.dispatchEvent(new CustomEvent('data-updated', {
      detail: { data },
      bubbles: true
    }));
  }

  // Method to send messages to VS Code extension
  sendMessage(type: string, payload: any) {
    this.dispatchEvent(new CustomEvent('vscode-message', {
      detail: { type, payload },
      bubbles: true
    }));
  }
}

// Register the web component
customElements.define('codesate-ui', CodeStateUI);

// Export for potential direct usage
export { CodeStateUI };