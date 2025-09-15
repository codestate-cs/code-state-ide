import { memo, useCallback, lazy, Suspense } from 'preact/compat';
import { AlertDialog } from './AlertDialog';

// Lazy load dialog components
const CreateSessionDialog = lazy(() => import('./CreateSessionDialog').then(module => ({ default: module.CreateSessionDialog })));
const CreateScriptDialog = lazy(() => import('./CreateScriptDialog').then(module => ({ default: module.CreateScriptDialog })));
const CreateTerminalCollectionDialog = lazy(() => import('./CreateTerminalCollectionDialog').then(module => ({ default: module.CreateTerminalCollectionDialog })));
const ConfigDialog = lazy(() => import('./ConfigDialog').then(module => ({ default: module.ConfigDialog })));
import { useSessionStore, useScriptStore, useTerminalCollectionStore, useConfigStore } from '../store/combinedStore';
import type { DataProvider } from '../providers/DataProvider';

interface PopupManagerProps {
  provider: DataProvider;
}

export const PopupManager = memo(function PopupManager({ provider }: PopupManagerProps) {
  // Get popup state from individual stores
  const { 
    createSessionDialog, 
    currentSession, 
    isEditDialogOpen, 
    isDeleteDialogOpen,
    closeCreateSessionDialog,
    closeEditDialog
  } = useSessionStore();
  
  const { 
    createScriptDialog, 
    currentScript, 
    isScriptDeleteDialogOpen, 
    isScriptEditDialogOpen,
    closeCreateScriptDialog,
    closeScriptDeleteDialog,
    closeScriptEditDialog
  } = useScriptStore();
  
  const { 
    createTerminalCollectionDialog, 
    currentTerminalCollection, 
    isTerminalCollectionDeleteDialogOpen, 
    isTerminalCollectionEditDialogOpen,
    closeCreateTerminalCollectionDialog,
    closeTerminalCollectionEditDialog
  } = useTerminalCollectionStore();
  
  const { 
    configDialog, 
    closeConfigDialog 
  } = useConfigStore();
  
  // Combined close all dialogs action
  const closeAllDialogs = () => {
    closeCreateSessionDialog();
    closeCreateScriptDialog();
    closeCreateTerminalCollectionDialog();
    closeConfigDialog();
    // Close edit dialogs
    closeEditDialog();
    closeScriptEditDialog();
    closeTerminalCollectionEditDialog();
    // Close delete dialogs
    closeScriptDeleteDialog();
  };
  
  // Memoize delete handlers
  const handleDeleteSession = useCallback(() => {
    if (currentSession) {
      provider.sendMessage('codestate.session.delete', { id: currentSession.id });
      closeAllDialogs();
    }
  }, [currentSession, provider, closeAllDialogs]);
  
  const handleDeleteScript = useCallback(() => {
    if (currentScript) {
      provider.sendMessage('codestate.script.delete', { id: currentScript.id });
      closeAllDialogs();
    }
  }, [currentScript, provider, closeAllDialogs]);
  
  const handleDeleteTerminalCollection = useCallback(() => {
    if (currentTerminalCollection) {
      provider.sendMessage('codestate.terminal-collection.delete', { id: currentTerminalCollection.id });
      closeAllDialogs();
    }
  }, [currentTerminalCollection, provider, closeAllDialogs]);
  
  const handleCancelDelete = useCallback(() => {
    closeAllDialogs();
  }, [closeAllDialogs]);

  return (
    <Suspense fallback={<div className="dialog-loading">Loading...</div>}>
      {/* Create Session Dialog */}
      {createSessionDialog.isOpen && (
        <CreateSessionDialog
          isOpen={createSessionDialog.isOpen}
          onClose={closeCreateSessionDialog}
          provider={provider}
          sessionData={createSessionDialog.sessionData}
          sessionDataError={createSessionDialog.sessionDataError}
        />
      )}
      
      {/* Create Script Dialog */}
      {createScriptDialog.isOpen && (
        <CreateScriptDialog
          isOpen={createScriptDialog.isOpen}
          onClose={closeCreateScriptDialog}
          provider={provider}
          rootPath={createScriptDialog.rootPath || undefined}
        />
      )}
      
      {/* Create Terminal Collection Dialog */}
      {createTerminalCollectionDialog.isOpen && (
        <CreateTerminalCollectionDialog
          isOpen={createTerminalCollectionDialog.isOpen}
          onClose={closeCreateTerminalCollectionDialog}
          provider={provider}
          rootPath={createTerminalCollectionDialog.rootPath || undefined}
        />
      )}
      
      {/* Config Dialog */}
      {configDialog.isOpen && (
        <ConfigDialog
          isOpen={configDialog.isOpen}
          onClose={closeConfigDialog}
          provider={provider}
        />
      )}
      
      {/* Edit Script Dialog */}
      {isScriptEditDialogOpen && currentScript && (
        <CreateScriptDialog
          isOpen={isScriptEditDialogOpen}
          onClose={closeAllDialogs}
          provider={provider}
          editScript={currentScript}
        />
      )}
      
      {/* Edit Terminal Collection Dialog */}
      {isTerminalCollectionEditDialogOpen && currentTerminalCollection && (
        <CreateTerminalCollectionDialog
          isOpen={isTerminalCollectionEditDialogOpen}
          onClose={closeAllDialogs}
          provider={provider}
          editTerminalCollection={currentTerminalCollection}
        />
      )}
      
      {/* Edit Session Dialog */}
      {isEditDialogOpen && currentSession && (
        <CreateSessionDialog
          isOpen={isEditDialogOpen}
          onClose={closeAllDialogs}
          provider={provider}
          sessionData={null}
          sessionDataError={null}
          editSession={currentSession}
        />
      )}
      
      {/* Delete Session Dialog */}
      {isDeleteDialogOpen && currentSession && (
        <AlertDialog
          isOpen={isDeleteDialogOpen}
          title="Delete Session"
          message={`Are you sure you want to delete the session "${currentSession.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="destructive"
          onConfirm={handleDeleteSession}
          onCancel={handleCancelDelete}
          onClose={closeAllDialogs}
        />
      )}
      
      {/* Delete Script Dialog */}
      {isScriptDeleteDialogOpen && currentScript && (
        <AlertDialog
          isOpen={isScriptDeleteDialogOpen}
          title="Delete Script"
          message={`Are you sure you want to delete the script "${currentScript.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="destructive"
          onConfirm={handleDeleteScript}
          onCancel={handleCancelDelete}
          onClose={closeAllDialogs}
        />
      )}
      
      {/* Delete Terminal Collection Dialog */}
      {isTerminalCollectionDeleteDialogOpen && currentTerminalCollection && (
        <AlertDialog
          isOpen={isTerminalCollectionDeleteDialogOpen}
          title="Delete Terminal Collection"
          message={`Are you sure you want to delete the terminal collection "${currentTerminalCollection.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="destructive"
          onConfirm={handleDeleteTerminalCollection}
          onCancel={handleCancelDelete}
          onClose={closeAllDialogs}
        />
      )}
    </Suspense>
  );
});