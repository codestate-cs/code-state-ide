import { CreateSessionDialog } from './CreateSessionDialog';
import { CreateScriptDialog } from './CreateScriptDialog';
import { CreateTerminalCollectionDialog } from './CreateTerminalCollectionDialog';
import { ConfigDialog } from './ConfigDialog';
import { AlertDialog } from './AlertDialog';
import { useCodeStateStore } from '../store/codestateStore';
import type { DataProvider } from '../providers/DataProvider';

interface PopupManagerProps {
  provider: DataProvider;
}

export function PopupManager({ provider }: PopupManagerProps) {
  // Get popup state from store
  const createSessionDialog = useCodeStateStore((state) => state.createSessionDialog);
  const createScriptDialog = useCodeStateStore((state) => state.createScriptDialog);
  const createTerminalCollectionDialog = useCodeStateStore((state) => state.createTerminalCollectionDialog);
  const configDialog = useCodeStateStore((state) => state.configDialog);
  const currentSession = useCodeStateStore((state) => state.currentSession);
  const currentScript = useCodeStateStore((state) => state.currentScript);
  const currentTerminalCollection = useCodeStateStore((state) => state.currentTerminalCollection);
  const isEditDialogOpen = useCodeStateStore((state) => state.isEditDialogOpen);
  const isDeleteDialogOpen = useCodeStateStore((state) => state.isDeleteDialogOpen);
  const isScriptDeleteDialogOpen = useCodeStateStore((state) => state.isScriptDeleteDialogOpen);
  const isScriptEditDialogOpen = useCodeStateStore((state) => state.isScriptEditDialogOpen);
  const isTerminalCollectionDeleteDialogOpen = useCodeStateStore((state) => state.isTerminalCollectionDeleteDialogOpen);
  const isTerminalCollectionEditDialogOpen = useCodeStateStore((state) => state.isTerminalCollectionEditDialogOpen);
  
  // Get actions from store
  const closeCreateSessionDialog = useCodeStateStore((state) => state.closeCreateSessionDialog);
  const closeCreateScriptDialog = useCodeStateStore((state) => state.closeCreateScriptDialog);
  const closeCreateTerminalCollectionDialog = useCodeStateStore((state) => state.closeCreateTerminalCollectionDialog);
  const closeConfigDialog = useCodeStateStore((state) => state.closeConfigDialog);
  const closeAllDialogs = useCodeStateStore((state) => state.closeAllDialogs);
  
  // Delete session handler
  const handleDeleteSession = () => {
    if (currentSession) {
      provider.sendMessage('codestate.session.delete', { id: currentSession.id });
      closeAllDialogs();
    }
  };
  
  // Delete script handler
  const handleDeleteScript = () => {
    if (currentScript) {
      provider.sendMessage('codestate.script.delete', { id: currentScript.id });
      closeAllDialogs();
    }
  };
  
  // Delete terminal collection handler
  const handleDeleteTerminalCollection = () => {
    if (currentTerminalCollection) {
      provider.sendMessage('codestate.terminal-collection.delete', { id: currentTerminalCollection.id });
      closeAllDialogs();
    }
  };
  
  // Cancel delete handler
  const handleCancelDelete = () => {
    closeAllDialogs();
  };

  return (
    <>
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
    </>
  );
}