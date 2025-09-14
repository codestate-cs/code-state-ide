/**
 * Simple logger utility for the extension
 */
export class Logger {
  private static instance: Logger;
  private context?: string;

  private constructor(context?: string) {
    this.context = context;
  }

  static getInstance(context?: string): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(context);
    }
    return Logger.instance;
  }

  log(message: string, ...args: any[]): void {
    console.log(`[CodeState IDE${this.context ? ` - ${this.context}` : ''}] ${message}`, ...args);
  }

  error(message: string, ...args: any[]): void {
    console.error(`[CodeState IDE${this.context ? ` - ${this.context}` : ''}] ERROR: ${message}`, ...args);
  }

  warn(message: string, ...args: any[]): void {
    console.warn(`[CodeState IDE${this.context ? ` - ${this.context}` : ''}] WARN: ${message}`, ...args);
  }

  debug(message: string, ...args: any[]): void {
    console.log(`[CodeState IDE${this.context ? ` - ${this.context}` : ''}] DEBUG: ${message}`, ...args);
  }
}