import * as vscode from 'vscode';
import { GitService } from '@codestate/core';
import { Result } from '@codestate/core';

export interface GitValidationResult {
  gitState: {
    branch: string;
    commit: string;
    isDirty: boolean;
    stashId?: string | null;
  };
  wasCommitted: boolean;
  commitMessage?: string;
}

export class GitValidationService {
  private gitService: GitService;

  constructor() {
    this.gitService = new GitService();
  }

  /**
   * Validates git state and handles uncommitted changes
   * @param projectRoot - The project root directory
   * @returns Promise<Result<GitValidationResult>>
   */
  async validateAndHandleGitState(projectRoot: string): Promise<Result<GitValidationResult>> {
    try {
      console.log('GitValidationService: Starting git validation for project root:', projectRoot);
      
      // Get current git state
      const gitStateResult = await this.getGitState(projectRoot);
      if (!gitStateResult.ok) {
        console.error('GitValidationService: Failed to get git state:', gitStateResult.error);
        return {
          ok: false,
          error: new Error(`Failed to get git state: ${gitStateResult.error.message}`)
        };
      }

      const gitState = gitStateResult.value;
      console.log('GitValidationService: Git state retrieved:', {
        branch: gitState.branch,
        commit: gitState.commit,
        isDirty: gitState.isDirty
      });

      // If repository is clean, return immediately
      if (!gitState.isDirty) {
        console.log('GitValidationService: Repository is clean, proceeding without commit dialog');
        return {
          ok: true,
          value: {
            gitState,
            wasCommitted: false
          }
        };
      }

      console.log('GitValidationService: Repository has uncommitted changes, showing commit dialog');

      // Repository has uncommitted changes, ask user what to do
      const userChoice = await this.showCommitDialog();
      
      if (userChoice === 'cancel') {
        return {
          ok: false,
          error: new Error('User cancelled session creation due to uncommitted changes')
        };
      }

      if (userChoice === 'commit') {
        const commitResult = await this.handleCommitProcess(projectRoot);
        if (!commitResult.ok) {
          return {
            ok: false,
            error: new Error(`Failed to commit changes: ${commitResult.error.message}`)
          };
        }

        // Wait a moment for VS Code git state to refresh
        console.log('GitValidationService: Waiting for git state to refresh after commit...');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Get updated git state after commit
        console.log('GitValidationService: Getting updated git state after commit...');
        const updatedGitStateResult = await this.getGitState(projectRoot);
        if (!updatedGitStateResult.ok) {
          console.error('GitValidationService: Failed to get updated git state:', updatedGitStateResult.error);
          return {
            ok: false,
            error: new Error(`Failed to get updated git state: ${updatedGitStateResult.error.message}`)
          };
        }

        console.log('GitValidationService: Updated git state after commit:', {
          branch: updatedGitStateResult.value.branch,
          commit: updatedGitStateResult.value.commit,
          isDirty: updatedGitStateResult.value.isDirty
        });

        return {
          ok: true,
          value: {
            gitState: updatedGitStateResult.value,
            wasCommitted: true,
            commitMessage: commitResult.value
          }
        };
      }

      // User chose to proceed without committing
      return {
        ok: true,
        value: {
          gitState,
          wasCommitted: false
        }
      };

    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error : new Error('Unknown error occurred during git validation')
      };
    }
  }

  /**
   * Get current git state for the project
   */
  private async getGitState(projectRoot: string): Promise<Result<GitValidationResult['gitState']>> {
    try {
      console.log('GitValidationService: Creating GitService for project root:', projectRoot);
      
      // Create a new GitService instance with the project root
      const gitService = new GitService(projectRoot);

      // Get current branch
      console.log('GitValidationService: Getting current branch...');
      const branchResult = await gitService.getCurrentBranch();
      if (!branchResult.ok) {
        console.error('GitValidationService: Failed to get current branch:', branchResult.error);
        return {
          ok: false,
          error: new Error(`Failed to get current branch: ${branchResult.error.message}`)
        };
      }
      console.log('GitValidationService: Current branch:', branchResult.value);

      // Get current commit
      console.log('GitValidationService: Getting current commit...');
      const commitResult = await gitService.getCurrentCommit();
      if (!commitResult.ok) {
        console.error('GitValidationService: Failed to get current commit:', commitResult.error);
        return {
          ok: false,
          error: new Error(`Failed to get current commit: ${commitResult.error.message}`)
        };
      }
      console.log('GitValidationService: Current commit:', commitResult.value);

      // Check if repository is dirty using VS Code's git API
      console.log('GitValidationService: Checking if repository is dirty using VS Code git API...');
      const isDirty = await this.checkRepositoryDirty(projectRoot);
      console.log('GitValidationService: Repository is dirty (VS Code API):', isDirty);

      return {
        ok: true,
        value: {
          branch: branchResult.value,
          commit: commitResult.value,
          isDirty: isDirty,
          stashId: null // TODO: Implement stash handling if needed
        }
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error : new Error('Unknown error occurred while getting git state')
      };
    }
  }

  /**
   * Check if repository has uncommitted changes using VS Code's git API
   */
  private async checkRepositoryDirty(projectRoot: string): Promise<boolean> {
    try {
      // Get the git extension
      const gitExtension = vscode.extensions.getExtension('vscode.git');
      if (!gitExtension) {
        console.warn('GitValidationService: Git extension not found, falling back to GitService');
        // Fallback to GitService if VS Code git extension is not available
        const gitService = new GitService(projectRoot);
        const isDirtyResult = await gitService.getIsDirty();
        return isDirtyResult.ok ? isDirtyResult.value : false;
      }

      if (!gitExtension.isActive) {
        await gitExtension.activate();
      }

      const git = gitExtension.exports.getAPI(1);
      if (!git) {
        console.warn('GitValidationService: Git API not available, falling back to GitService');
        const gitService = new GitService(projectRoot);
        const isDirtyResult = await gitService.getIsDirty();
        return isDirtyResult.ok ? isDirtyResult.value : false;
      }

      // Find the repository for the project root
      const repository = git.repositories.find((repo: any) => {
        const repoPath = repo.rootUri.fsPath;
        return projectRoot === repoPath || projectRoot.startsWith(repoPath);
      });

      if (!repository) {
        console.warn('GitValidationService: No git repository found for project root:', projectRoot);
        return false;
      }

      // Force refresh the repository state
      await repository.status();

      // Check if there are uncommitted changes
      const hasUncommittedChanges = repository.state.workingTreeChanges.length > 0 || 
                                   repository.state.indexChanges.length > 0 ||
                                   repository.state.mergeChanges.length > 0;

      console.log('GitValidationService: VS Code git status (after refresh):', {
        workingTreeChanges: repository.state.workingTreeChanges.length,
        indexChanges: repository.state.indexChanges.length,
        mergeChanges: repository.state.mergeChanges.length,
        hasUncommittedChanges
      });

      return hasUncommittedChanges;
    } catch (error) {
      console.error('GitValidationService: Error checking repository dirty status:', error);
      // Fallback to GitService
      const gitService = new GitService(projectRoot);
      const isDirtyResult = await gitService.getIsDirty();
      return isDirtyResult.ok ? isDirtyResult.value : false;
    }
  }

  /**
   * Show dialog asking user what to do with uncommitted changes
   */
  private async showCommitDialog(): Promise<'commit' | 'proceed' | 'cancel'> {
    console.log('GitValidationService: Showing commit dialog to user');
    
    const choice = await vscode.window.showInformationMessage(
      'You have uncommitted changes in your repository. What would you like to do?',
      'Commit Changes',
      'Cancel'
    );

    console.log('GitValidationService: User choice:', choice);

    switch (choice) {
      case 'Commit Changes':
        console.log('GitValidationService: User chose to commit changes');
        return 'commit';
      case 'Cancel':
      default:
        console.log('GitValidationService: User chose to cancel');
        return 'cancel';
    }
  }

  /**
   * Handle the commit process
   */
  private async handleCommitProcess(projectRoot: string): Promise<Result<string>> {
    try {
      console.log('GitValidationService: Starting commit process for project root:', projectRoot);
      
      // Show input box for commit message
      const commitMessage = await vscode.window.showInputBox({
        prompt: 'Enter commit message',
        placeHolder: 'Commit message for session creation',
        validateInput: (value) => {
          if (!value || value.trim().length === 0) {
            return 'Commit message cannot be empty';
          }
          return null;
        }
      });

      if (!commitMessage) {
        console.log('GitValidationService: User cancelled commit message input');
        return {
          ok: false,
          error: new Error('User cancelled commit message input')
        };
      }

      console.log('GitValidationService: Commit message received:', commitMessage);

      // Create a new GitService instance with the project root
      const gitService = new GitService(projectRoot);

      // Commit the changes
      console.log('GitValidationService: Committing changes with message:', commitMessage.trim());
      const commitResult = await gitService.commitChanges(commitMessage.trim());
      if (!commitResult.ok) {
        console.error('GitValidationService: Failed to commit changes:', commitResult.error);
        return {
          ok: false,
          error: new Error(`Failed to commit changes: ${commitResult.error.message}`)
        };
      }

      if (!commitResult.value) {
        console.error('GitValidationService: Commit operation returned false');
        return {
          ok: false,
          error: new Error('Commit operation returned false')
        };
      }

      console.log('GitValidationService: Successfully committed changes');
      return {
        ok: true,
        value: commitMessage.trim()
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error : new Error('Unknown error occurred during commit process')
      };
    }
  }
}