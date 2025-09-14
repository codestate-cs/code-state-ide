import { 
  CreateTerminalCollection, 
  UpdateTerminalCollection, 
  DeleteTerminalCollections, 
  GetTerminalCollections, 
  ExecuteTerminalCollection,
  TerminalCollection,
  Result
} from '@codestate/core';

export class TerminalCollectionService {
  private static instance: TerminalCollectionService;

  private constructor() {}

  static getInstance(): TerminalCollectionService {
    if (!TerminalCollectionService.instance) {
      TerminalCollectionService.instance = new TerminalCollectionService();
    }
    return TerminalCollectionService.instance;
  }

  /**
   * Create a new terminal collection
   */
  async createTerminalCollection(terminalCollection: TerminalCollection): Promise<Result<void>> {
    const useCase = new CreateTerminalCollection();
    return await useCase.execute(terminalCollection);
  }

  /**
   * Update an existing terminal collection
   */
  async updateTerminalCollection(id: string, terminalCollectionUpdate: Partial<TerminalCollection>): Promise<Result<void>> {
    const useCase = new UpdateTerminalCollection();
    return await useCase.execute(id, terminalCollectionUpdate);
  }

  /**
   * Delete a terminal collection
   */
  async deleteTerminalCollection(id: string): Promise<Result<void>> {
    const useCase = new DeleteTerminalCollections();
    return await useCase.execute([id]);
  }

  /**
   * Get all terminal collections
   */
  async getTerminalCollections(): Promise<Result<any[]>> {
    const useCase = new GetTerminalCollections();
    return await useCase.execute();
  }

  /**
   * Execute a terminal collection
   */
  async executeTerminalCollection(id: string): Promise<Result<void>> {
    const useCase = new ExecuteTerminalCollection();
    return await useCase.execute(id);
  }
}