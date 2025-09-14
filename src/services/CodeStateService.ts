import { Result } from '@codestate/core';
import { SessionService } from './SessionService';
import { ScriptService } from './ScriptService';
import { TerminalCollectionService } from './TerminalCollectionService';
import { InitResponseData } from '../types';

export class CodeStateService {
  private static instance: CodeStateService;
  private sessionService: SessionService;
  private scriptService: ScriptService;
  private terminalCollectionService: TerminalCollectionService;

  private constructor() {
    // Initialize individual services using singleton pattern
    this.sessionService = SessionService.getInstance();
    this.scriptService = ScriptService.getInstance();
    this.terminalCollectionService = TerminalCollectionService.getInstance();
  }

  static getInstance(): CodeStateService {
    if (!CodeStateService.instance) {
      CodeStateService.instance = new CodeStateService();
    }
    return CodeStateService.instance;
  }

  /**
   * Get all initial data for the application
   */
  async getInitData(): Promise<Result<InitResponseData>> {
    try {
      // Fetch all data in parallel for better performance
      const [sessionsResult, scriptsResult, terminalCollectionsResult] = await Promise.all([
        this.sessionService.listSessions({ loadAll: true }),
        this.scriptService.getScripts(),
        this.terminalCollectionService.getTerminalCollections()
      ]);

      // Check if any of the operations failed
      if (!sessionsResult.ok) {
        return {
          ok: false,
          error: new Error(`Failed to fetch sessions: ${sessionsResult.error.message}`)
        };
      }

      if (!scriptsResult.ok) {
        return {
          ok: false,
          error: new Error(`Failed to fetch scripts: ${scriptsResult.error.message}`)
        };
      }

      if (!terminalCollectionsResult.ok) {
        return {
          ok: false,
          error: new Error(`Failed to fetch terminal collections: ${terminalCollectionsResult.error.message}`)
        };
      }

      // Return successful result with all data
      return {
        ok: true,
        value: {
          success: true,
          sessions: sessionsResult.value,
          scripts: scriptsResult.value,
          terminalCollections: terminalCollectionsResult.value
        }
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  }

  /**
   * Get session service
   */
  getSessionService(): SessionService {
    return this.sessionService;
  }

  /**
   * Get script service
   */
  getScriptService(): ScriptService {
    return this.scriptService;
  }

  /**
   * Get terminal collection service
   */
  getTerminalCollectionService(): TerminalCollectionService {
    return this.terminalCollectionService;
  }
}