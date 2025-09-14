import { 
  CreateScript, 
  UpdateScript, 
  DeleteScript, 
  GetScripts, 
  ResumeScript,
  Script,
  Result
} from '@codestate/core';

export class ScriptService {
  private static instance: ScriptService;

  private constructor() {}

  static getInstance(): ScriptService {
    if (!ScriptService.instance) {
      ScriptService.instance = new ScriptService();
    }
    return ScriptService.instance;
  }

  /**
   * Create a new script
   */
  async createScript(script: Script): Promise<Result<void>> {
    const useCase = new CreateScript();
    return await useCase.execute(script);
  }

  /**
   * Update an existing script
   */
  async updateScript(id: string, scriptUpdate: Partial<Script>): Promise<Result<void>> {
    const useCase = new UpdateScript();
    return await useCase.execute(id, scriptUpdate);
  }

  /**
   * Delete scripts
   */
  async deleteScripts(ids: string[]): Promise<Result<void>> {
    const useCase = new DeleteScript();
    return await useCase.execute(ids);
  }

  /**
   * Get all scripts
   */
  async getScripts(options?: {
    rootPath?: string;
    lifecycle?: "open" | "resume" | "none";
  }): Promise<Result<Script[]>> {
    const useCase = new GetScripts();
    return await useCase.execute(options);
  }

  /**
   * Resume a script
   */
  async resumeScript(scriptId: string): Promise<Result<void>> {
    const useCase = new ResumeScript();
    return await useCase.execute(scriptId);
  }
}