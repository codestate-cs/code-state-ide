// Jest setup file
import '@types/jest';

// Mock VS Code API for testing
const mockVSCode = {
  window: {
    createOutputChannel: jest.fn(() => ({
      appendLine: jest.fn(),
      show: jest.fn(),
      dispose: jest.fn(),
    })),
    showInformationMessage: jest.fn(),
    showErrorMessage: jest.fn(),
    showWarningMessage: jest.fn(),
    showInputBox: jest.fn(),
    showQuickPick: jest.fn(),
    activeTextEditor: undefined,
    visibleTextEditors: [],
    terminals: [],
    activeTerminal: undefined,
  },
  workspace: {
    workspaceFolders: [],
    getConfiguration: jest.fn(() => ({
      get: jest.fn(),
      update: jest.fn(),
    })),
    openTextDocument: jest.fn(),
  },
  commands: {
    executeCommand: jest.fn(),
  },
  Uri: {
    parse: jest.fn(),
  },
  ViewColumn: {
    One: 1,
    Two: 2,
    Three: 3,
  },
  ProgressLocation: {
    Notification: 1,
  },
  Selection: jest.fn(),
  Position: jest.fn(),
  version: '1.102.0',
};

// Mock the vscode module
jest.mock('vscode', () => mockVSCode);

// Global test timeout
jest.setTimeout(10000); 