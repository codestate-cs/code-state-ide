import * as vscode from 'vscode';
import { ErrorHandler } from '../../shared/errors/ErrorHandler';
import { ExtensionError, ErrorContext } from '../../shared/errors/ExtensionError';
import { ConfigService } from '../../infrastructure/services/ConfigService';
import type { Config } from '@codestate/core';

export interface ConfigTreeItem extends vscode.TreeItem {
  contextValue: string;
  collapsibleState: vscode.TreeItemCollapsibleState;
  getChildren(): Promise<ConfigTreeItem[]>;
}

export class ConfigTreeDataProvider implements vscode.TreeDataProvider<ConfigTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<ConfigTreeItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private errorHandler: ErrorHandler;
  private configService: ConfigService;

  constructor() {
    this.errorHandler = ErrorHandler.getInstance();
    this.configService = ConfigService.getInstance();
  }

  async getChildren(element?: ConfigTreeItem): Promise<ConfigTreeItem[]> {
    try {
      console.log('ConfigTreeDataProvider.getChildren called', { element: element?.label });
      
      if (!element) {
        // Root level - show config categories based on @code-state/core Config interface
        console.log('Getting root level config categories...');
        const categories = await this.getConfigCategories();
        console.log('Config categories:', categories.length);
        return categories;
      }

      console.log('Getting children for config element:', element.label);
      const children = await element.getChildren();
      console.log('Config children count:', children.length);
      return children;
    } catch (error) {
      console.error('Error in ConfigTreeDataProvider.getChildren:', error);
      const extensionError = error instanceof ExtensionError ? error : ExtensionError.fromError(
        error instanceof Error ? error : new Error(String(error)),
        undefined,
        ErrorContext.TREE_VIEW
      );
      this.errorHandler.handleError(extensionError, ErrorContext.TREE_VIEW, false);
      return [];
    }
  }

  getTreeItem(element: ConfigTreeItem): vscode.TreeItem {
    // Add command to editable items
    if (element.contextValue === 'editable-setting') {
      element.command = {
        command: 'codestate.editConfig',
        title: 'Edit Configuration',
        arguments: [element]
      };
    }
    return element;
  }

  async refresh(): Promise<void> {
    await this.configService.refreshConfig();
    this._onDidChangeTreeData.fire(undefined);
  }

  private async getConfigCategories(): Promise<ConfigTreeItem[]> {
    // Always fetch fresh config to ensure tree view shows latest data
    const config = await this.configService.getConfig();
    
    if (!config) {
      return [new ErrorConfigTreeItem()];
    }

    return [
      new RefreshConfigTreeItem(),
      new EditConfigTreeItem(),
      new SeparatorTreeItem(),
      new CoreSettingsTreeItem(this.configService),
      new EncryptionSettingsTreeItem(this.configService)
    ];
  }
}

export class RefreshConfigTreeItem implements ConfigTreeItem {
  public readonly contextValue = 'config-action';
  public readonly collapsibleState = vscode.TreeItemCollapsibleState.None;
  public readonly label = '🔄 Refresh Configuration';
  public readonly tooltip = 'Refresh configuration from CodeState core';
  public readonly iconPath = '';
  public readonly command = {
    command: 'codestate.refreshConfig',
    title: 'Refresh Configuration'
  };

  async getChildren(): Promise<ConfigTreeItem[]> {
    return [];
  }
}

export class EditConfigTreeItem implements ConfigTreeItem {
  public readonly contextValue = 'config-action';
  public readonly collapsibleState = vscode.TreeItemCollapsibleState.None;
  public readonly label = '✏️ Edit Configuration';
  public readonly tooltip = 'Open configuration editor';
  public readonly iconPath = '';
  public readonly command = {
    command: 'codestate.editConfig',
    title: 'Edit Configuration'
  };

  async getChildren(): Promise<ConfigTreeItem[]> {
    return [];
  }
}

export class SeparatorTreeItem implements ConfigTreeItem {
  public readonly contextValue = 'config-separator';
  public readonly collapsibleState = vscode.TreeItemCollapsibleState.None;
  public readonly label = '─────────────────';
  public readonly tooltip = '';
  public readonly iconPath = undefined;
  public readonly description = '';

  async getChildren(): Promise<ConfigTreeItem[]> {
    return [];
  }
}

export class ErrorConfigTreeItem implements ConfigTreeItem {
  public readonly contextValue = 'config-error';
  public readonly collapsibleState = vscode.TreeItemCollapsibleState.None;
  public readonly label = '❌ Failed to load configuration';
  public readonly tooltip = 'Unable to fetch configuration from CodeState core';
  public readonly iconPath = undefined;

  async getChildren(): Promise<ConfigTreeItem[]> {
    return [];
  }
}

export class CoreSettingsTreeItem implements ConfigTreeItem {
  public readonly contextValue = 'config-category';
  public readonly collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
  public readonly label = '🎯 Core Settings';
  public readonly tooltip = 'Core CodeState configuration';
  public readonly iconPath = undefined;

  constructor(private configService: ConfigService) {}

  async getChildren(): Promise<ConfigTreeItem[]> {
    // Fetch fresh config to ensure we show latest values
    const config = await this.configService.getConfig();
    if (!config) {
      return [new ErrorConfigTreeItem()];
    }

    return [
      new ReadOnlySettingTreeItem('Version', config.version),
      new EditableSettingTreeItem('IDE', config.ide === 'vscode' ? 'VS Code' : 'Cursor', 'ide'),
      new EditableSettingTreeItem('Storage Path', config.storagePath, 'storagePath')
    ];
  }
}

export class EncryptionSettingsTreeItem implements ConfigTreeItem {
  public readonly contextValue = 'config-category';
  public readonly collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
  public readonly label = '🔐 Encryption Settings';
  public readonly tooltip = 'Encryption configuration';
  public readonly iconPath = undefined;

  constructor(private configService: ConfigService) {}

  async getChildren(): Promise<ConfigTreeItem[]> {
    // Fetch fresh config to ensure we show latest values
    const config = await this.configService.getConfig();
    if (!config) {
      return [new ErrorConfigTreeItem()];
    }

    return [
      new ReadOnlySettingTreeItem('Encryption Enabled', config.encryption.enabled ? 'Yes' : 'No'),
      new EditableSettingTreeItem('Encryption Key', config.encryption.encryptionKey ? 'Set' : 'Not Set', 'encryption.encryptionKey')
    ];
  }
}

export class ReadOnlySettingTreeItem implements ConfigTreeItem {
  public readonly contextValue = 'readonly-setting';
  public readonly collapsibleState = vscode.TreeItemCollapsibleState.None;

  constructor(
    private settingName: string,
    private settingValue: string
  ) {
    this.label = this.getSettingLabel();
    this.tooltip = this.getSettingTooltip();
    this.iconPath = undefined;
    this.description = this.settingValue;
  }

  public readonly label: string;
  public readonly tooltip: string;
  public readonly iconPath: undefined;
  public readonly description: string;

  async getChildren(): Promise<ConfigTreeItem[]> {
    return [];
  }

  private getSettingLabel(): string {
    return `📋 ${this.settingName}`;
  }

  private getSettingTooltip(): string {
    return `${this.settingName}\nValue: ${this.settingValue}`;
  }
}

export class EditableSettingTreeItem implements ConfigTreeItem {
  public readonly contextValue = 'editable-setting';
  public readonly collapsibleState = vscode.TreeItemCollapsibleState.None;

  constructor(
    private settingName: string,
    private settingValue: string,
    private settingKey: string
  ) {
    this.label = this.getSettingLabel();
    this.tooltip = this.getSettingTooltip();
    this.iconPath = undefined;
    this.description = this.settingValue;
  }

  public readonly label: string;
  public readonly tooltip: string;
  public readonly iconPath: undefined;
  public readonly description: string;

  async getChildren(): Promise<ConfigTreeItem[]> {
    return [];
  }

  private getSettingLabel(): string {
    return `✏️ ${this.settingName}`;
  }

  private getSettingTooltip(): string {
    return `${this.settingName}\nValue: ${this.settingValue}\nClick to edit`;
  }
}
