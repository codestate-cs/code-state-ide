import type { VSCodeMessage } from '../DataProvider';

export class DataInitHandler {
  private onSessionsInit?: (data: any) => void;
  private onScriptsInit?: (data: any) => void;
  private onTerminalCollectionsInit?: (data: any) => void;
  private onSessionCreateInit?: (data: any) => void;

  // Register handlers
  setSessionsInitHandler(handler: (data: any) => void): void {
    this.onSessionsInit = handler;
  }

  setScriptsInitHandler(handler: (data: any) => void): void {
    this.onScriptsInit = handler;
  }

  setTerminalCollectionsInitHandler(handler: (data: any) => void): void {
    this.onTerminalCollectionsInit = handler;
  }

  setSessionCreateInitHandler(handler: (data: any) => void): void {
    this.onSessionCreateInit = handler;
  }

  // Handle data init events
  handleSessionsInitResponse(message: VSCodeMessage): void {
    console.log('DataInitHandler: Sessions init response', message.payload);
    if (this.onSessionsInit) {
      this.onSessionsInit(message.payload);
    }
  }

  handleScriptsInitResponse(message: VSCodeMessage): void {
    console.log('DataInitHandler: Scripts init response', message.payload);
    if (this.onScriptsInit) {
      this.onScriptsInit(message.payload);
    }
  }

  handleTerminalCollectionsInitResponse(message: VSCodeMessage): void {
    console.log('DataInitHandler: Terminal collections init response', message.payload);
    if (this.onTerminalCollectionsInit) {
      this.onTerminalCollectionsInit(message.payload);
    }
  }

  handleSessionCreateInitResponse(message: VSCodeMessage): void {
    console.log('DataInitHandler: Session create init response', message.payload);
    if (this.onSessionCreateInit) {
      if (message.payload.status === 'error') {
        this.onSessionCreateInit(message.payload);
      } else {
        this.onSessionCreateInit(message.payload.sessionData);
      }
    }
  }

  // Clean up handlers
  destroy(): void {
    this.onSessionsInit = undefined;
    this.onScriptsInit = undefined;
    this.onTerminalCollectionsInit = undefined;
    this.onSessionCreateInit = undefined;
  }
}