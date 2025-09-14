import type { VSCodeMessage } from '../DataProvider';

export class SessionEventHandler {
  private onSessionCreate?: (data: any) => void;
  private onSessionDelete?: (data: any) => void;
  private onSessionUpdate?: (data: any) => void;
  private onSessionResume?: (data: any) => void;
  private onSessionExport?: (data: any) => void;

  // Register handlers
  setSessionCreateHandler(handler: (data: any) => void): void {
    this.onSessionCreate = handler;
  }

  setSessionDeleteHandler(handler: (data: any) => void): void {
    this.onSessionDelete = handler;
  }

  setSessionUpdateHandler(handler: (data: any) => void): void {
    this.onSessionUpdate = handler;
  }

  setSessionResumeHandler(handler: (data: any) => void): void {
    this.onSessionResume = handler;
  }

  setSessionExportHandler(handler: (data: any) => void): void {
    this.onSessionExport = handler;
  }

  // Handle session events
  handleSessionCreateResponse(message: VSCodeMessage): void {
    console.log('SessionEventHandler: Session create response', message);
    if (this.onSessionCreate) {
      this.onSessionCreate(message);
    }
  }

  handleSessionDeleteResponse(message: VSCodeMessage): void {
    console.log('SessionEventHandler: Session delete response', message);
    if (this.onSessionDelete) {
      this.onSessionDelete(message);
    }
  }

  handleSessionUpdateResponse(message: VSCodeMessage): void {
    console.log('SessionEventHandler: Session update response', message);
    if (this.onSessionUpdate) {
      this.onSessionUpdate(message);
    }
  }

  handleSessionResumeResponse(message: VSCodeMessage): void {
    console.log('SessionEventHandler: Session resume response', message);
    if (this.onSessionResume) {
      this.onSessionResume(message);
    }
  }

  handleSessionExportResponse(message: VSCodeMessage): void {
    console.log('SessionEventHandler: Session export response', message);
    if (this.onSessionExport) {
      this.onSessionExport(message);
    }
  }

  // Clean up handlers
  destroy(): void {
    this.onSessionCreate = undefined;
    this.onSessionDelete = undefined;
    this.onSessionUpdate = undefined;
    this.onSessionResume = undefined;
    this.onSessionExport = undefined;
  }
}