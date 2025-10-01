import * as vscode from 'vscode';
import { Logger } from '../utils/logger';
import { CodeStateService } from './CodeStateService';
import { Script, ScriptCommand } from '@codestate/core';

export interface TerminalCollection {
  id: string;
  name: string;
  rootPath: string;
  executionMode?: 'ide' | 'same-terminal' | 'multi-terminal';
  scriptReferences?: ScriptReference[];
  scripts?: Script[]; // Full script data from core library
  lifecycle?: string[];
  closeTerminalAfterExecution?: boolean;
}

export interface ScriptReference {
  id: string;
  rootPath: string;
}

export class IDETerminalService {
  private static instance: IDETerminalService;
  private logger: Logger;
  private codeStateService: CodeStateService;

  private constructor() {
    this.logger = Logger.getInstance('IDETerminalService');
    this.codeStateService = CodeStateService.getInstance();
  }

  static getInstance(): IDETerminalService {
    if (!IDETerminalService.instance) {
      IDETerminalService.instance = new IDETerminalService();
    }
    return IDETerminalService.instance;
  }

  /**
   * Execute terminal collection in IDE terminals
   */
  async executeTerminalCollection(terminalCollection: TerminalCollection): Promise<void> {
    try {
      this.logger.log(`Executing terminal collection "${terminalCollection.name}" in IDE mode`);

      let scriptsToExecute: Script[] = [];

      // Check if we have full script data already (from core library)
      if (terminalCollection.scripts && terminalCollection.scripts.length > 0) {
        this.logger.log(`Using full script data from terminal collection (${terminalCollection.scripts.length} scripts)`);
        scriptsToExecute = terminalCollection.scripts;
      } else if (terminalCollection.scriptReferences && terminalCollection.scriptReferences.length > 0) {
        this.logger.log(`Fetching scripts from references (${terminalCollection.scriptReferences.length} references)`);

        // Fetch all scripts to get the actual script data
        const scriptsResult = await this.codeStateService.getScriptService().getScripts();
        if (!scriptsResult.ok) {
          this.logger.log(`Failed to fetch scripts: ${scriptsResult.error.message}`);
          throw new Error(`Failed to fetch scripts: ${scriptsResult.error.message}`);
        }

        const allScripts = scriptsResult.value;
        this.logger.log(`Fetched ${allScripts.length} scripts from core library`);

        // Filter scripts that are referenced in this terminal collection
        scriptsToExecute = allScripts.filter(script =>
          terminalCollection.scriptReferences!.some(ref => ref.id === script.id)
        );

        this.logger.log(`Found ${scriptsToExecute.length} referenced scripts`);
        this.logger.log(`Script reference IDs: ${terminalCollection.scriptReferences.map(ref => ref.id).join(', ')}`);
        this.logger.log(`Available script IDs: ${allScripts.map(script => script.id).join(', ')}`);
      } else {
        this.logger.log(`No scripts or script references found in terminal collection "${terminalCollection.name}"`);
        return;
      }

      if (scriptsToExecute.length === 0) {
        this.logger.log(`No scripts to execute for terminal collection "${terminalCollection.name}"`);
        return;
      }

      // Process each script in a separate terminal
      for (const script of scriptsToExecute) {
        this.logger.log(`Processing script: ${script.name}, commands: ${script.commands?.length || 0}`);
        await this.executeScript(script);
      }

      this.logger.log(`Successfully executed terminal collection "${terminalCollection.name}"`);
    } catch (error) {
      this.logger.log(`Failed to execute terminal collection "${terminalCollection.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Execute a single script in a new terminal tab
   */
  private async executeScript(script: Script): Promise<void> {
    try {
      this.logger.log(`Executing script "${script.name}" in new terminal`);
      this.logger.log(`Script commands: ${JSON.stringify(script.commands)}`);
      this.logger.log(`Script rootPath: ${script.rootPath}`);

      // Check if script has commands
      if (!script.commands || script.commands.length === 0) {
        this.logger.log(`No commands found in script "${script.name}"`);
        return;
      }

      // Extract command strings from ScriptCommand objects
      const commandStrings = script.commands.map(cmd => cmd.command);
      this.logger.log(`Extracted command strings: ${JSON.stringify(commandStrings)}`);

      // Create terminal with script name
      const terminal = vscode.window.createTerminal({
        name: script.name,
        cwd: script.rootPath
      });

      this.logger.log(`Created terminal "${script.name}" with working directory: ${script.rootPath}`);

      // Show the terminal
      terminal.show();
      this.logger.log(`Terminal "${script.name}" is now visible`);

      // Combine commands based on OS
      const combinedCommand = this.combineCommands(commandStrings);
      this.logger.log(`Combined command: ${combinedCommand}`);

      // Execute the combined command
      terminal.sendText(combinedCommand);
      this.logger.log(`Sent command to terminal "${script.name}"`);

      this.logger.log(`Successfully executed script "${script.name}"`);
    } catch (error) {
      this.logger.log(`Failed to execute script "${script.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Combine commands based on operating system
   */
  private combineCommands(commands: string[]): string {
    if (commands.length === 0) {
      return '';
    }

    if (commands.length === 1) {
      return commands[0];
    }

    // Determine command separator based on OS
    const isWindows = process.platform === 'win32';
    const separator = isWindows ? '; ' : ' && ';

    return commands.join(separator);
  }
}
