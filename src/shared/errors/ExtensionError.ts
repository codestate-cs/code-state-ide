export enum ErrorType {
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  PERMISSION = 'PERMISSION',
  NETWORK = 'NETWORK',
  STORAGE = 'STORAGE',
  VSCODE_API = 'VSCODE_API',
  CODECORE = 'CODECORE',
  UNKNOWN = 'UNKNOWN',
}

export enum ErrorContext {
  FILE_OPERATIONS = 'FILE_OPERATIONS',
  FILE_OPERATION = 'FILE_OPERATION',
  VALIDATION = 'VALIDATION',
  BACKUP = 'BACKUP',
  STATISTICS = 'STATISTICS',
  TERMINAL_OPERATIONS = 'TERMINAL_OPERATIONS',
  GIT_OPERATIONS = 'GIT_OPERATIONS',
  STORAGE_OPERATIONS = 'STORAGE_OPERATIONS',
  CONFIGURATION = 'CONFIGURATION',
  INITIALIZATION = 'INITIALIZATION',
  TREE_VIEW = 'TREE_VIEW',
  SESSION_MANAGEMENT = 'SESSION_MANAGEMENT',
}

export class ExtensionError extends Error {
  public readonly type: ErrorType;
  public readonly context: ErrorContext;
  public readonly code?: string;
  public readonly details?: Record<string, any>;
  public readonly originalError?: Error;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    context: ErrorContext = ErrorContext.INITIALIZATION,
    options?: {
      code?: string;
      details?: Record<string, any>;
      originalError?: Error;
    }
  ) {
    super(message);
    this.name = 'ExtensionError';
    this.type = type;
    this.context = context;
    this.code = options?.code;
    this.details = options?.details;
    this.originalError = options?.originalError;

    // Ensure proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ExtensionError);
    }
  }

  public toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      context: this.context,
      code: this.code,
      details: this.details,
      stack: this.stack,
      originalError: this.originalError?.message,
    };
  }

  public static fromError(
    error: Error,
    type: ErrorType = ErrorType.UNKNOWN,
    context: ErrorContext = ErrorContext.INITIALIZATION
  ): ExtensionError {
    return new ExtensionError(
      error.message,
      type,
      context,
      { originalError: error }
    );
  }

  public static validation(
    message: string,
    context: ErrorContext = ErrorContext.INITIALIZATION,
    details?: Record<string, any>
  ): ExtensionError {
    return new ExtensionError(message, ErrorType.VALIDATION, context, { details });
  }

  public static notFound(
    message: string,
    context: ErrorContext = ErrorContext.INITIALIZATION,
    details?: Record<string, any>
  ): ExtensionError {
    return new ExtensionError(message, ErrorType.NOT_FOUND, context, { details });
  }

  public static fileNotFound(
    message: string,
    context: ErrorContext = ErrorContext.FILE_OPERATIONS,
    details?: Record<string, any>
  ): ExtensionError {
    return new ExtensionError(message, ErrorType.NOT_FOUND, context, { details });
  }

  public static workspaceNotFound(
    message: string,
    context: ErrorContext = ErrorContext.INITIALIZATION,
    details?: Record<string, any>
  ): ExtensionError {
    return new ExtensionError(message, ErrorType.NOT_FOUND, context, { details });
  }

  public static permission(
    message: string,
    context: ErrorContext = ErrorContext.INITIALIZATION,
    details?: Record<string, any>
  ): ExtensionError {
    return new ExtensionError(message, ErrorType.PERMISSION, context, { details });
  }

  public static storage(
    message: string,
    context: ErrorContext = ErrorContext.STORAGE_OPERATIONS,
    details?: Record<string, any>
  ): ExtensionError {
    return new ExtensionError(message, ErrorType.STORAGE, context, { details });
  }

  public static vscodeAPI(
    message: string,
    context: ErrorContext = ErrorContext.INITIALIZATION,
    details?: Record<string, any>
  ): ExtensionError {
    return new ExtensionError(message, ErrorType.VSCODE_API, context, { details });
  }
} 