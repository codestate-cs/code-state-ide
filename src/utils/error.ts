/**
 * Error handling utilities
 */
export class CodeStateError extends Error {
  public code: string;
  public context?: any;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', context?: any) {
    super(message);
    this.name = 'CodeStateError';
    this.code = code;
    this.context = context;
  }
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(type: string, error: Error | string, id: string) {
  return {
    type: type + '.response',
    status: 'error' as const,
    error: error instanceof Error ? error.message : error,
    id
  };
}

/**
 * Handle and log errors consistently
 */
export function handleError(error: unknown, context?: string): Error {
  if (error instanceof Error) {
    console.error(`[CodeState IDE${context ? ` - ${context}` : ''}] Error:`, error.message);
    return error;
  }
  
  const unknownError = new Error('Unknown error occurred');
  console.error(`[CodeState IDE${context ? ` - ${context}` : ''}] Unknown error:`, error);
  return unknownError;
}