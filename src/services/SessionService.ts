import { 
  SaveSession, 
  UpdateSession, 
  DeleteSession, 
  ListSessions, 
  ResumeSession,
  Session,
  Result
} from '@codestate/core';

export class SessionService {
  private static instance: SessionService;

  private constructor() {}

  static getInstance(): SessionService {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService();
    }
    return SessionService.instance;
  }

  /**
   * Save a new session
   */
  async saveSession(input: {
    name: string;
    projectRoot: string;
    notes?: string;
    tags?: string[];
    files?: Session["files"];
    git: Session["git"];
    extensions?: Session["extensions"];
    terminalCommands?: Session["terminalCommands"];
    terminalCollections?: Session["terminalCollections"];
    scripts?: Session["scripts"];
  }): Promise<Result<Session>> {
    const useCase = new SaveSession();
    return await useCase.execute(input);
  }

  /**
   * Update an existing session
   */
  async updateSession(idOrName: string, input: {
    notes?: string;
    tags?: string[];
    files?: Session["files"];
    git?: Session["git"];
    extensions?: Session["extensions"];
    terminalCommands?: Session["terminalCommands"];
    terminalCollections?: Session["terminalCollections"];
    scripts?: Session["scripts"];
  }): Promise<Result<Session>> {
    const useCase = new UpdateSession();
    return await useCase.execute(idOrName, input);
  }

  /**
   * Delete a session
   */
  async deleteSession(idOrName: string): Promise<Result<void>> {
    const useCase = new DeleteSession();
    return await useCase.execute(idOrName);
  }

  /**
   * List all sessions
   */
  async listSessions(filter?: {
    tags?: string[];
    search?: string;
    loadAll?: boolean;
  }): Promise<Result<Session[] | any[]>> {
    const useCase = new ListSessions();
    return await useCase.execute(filter);
  }

  /**
   * Resume a session
   */
  async resumeSession(idOrName: string): Promise<Result<Session>> {
    const useCase = new ResumeSession();
    return await useCase.execute(idOrName);
  }
}