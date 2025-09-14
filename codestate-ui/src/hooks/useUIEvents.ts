import { useCallback } from 'preact/hooks';
import { useCodeStateStore, type UIEvent } from '../store/codestateStore';
import type { DataProvider } from '../providers/DataProvider';

export function useUIEvents(provider: DataProvider) {
  const openCreateSessionDialog = useCodeStateStore((state) => state.openCreateSessionDialog);
  const openEditDialog = useCodeStateStore((state) => state.openEditDialog);
  const openDeleteDialog = useCodeStateStore((state) => state.openDeleteDialog);
  const openScriptDeleteDialog = useCodeStateStore((state) => state.openScriptDeleteDialog);
  const openScriptEditDialog = useCodeStateStore((state) => state.openScriptEditDialog);
  const openTerminalCollectionDeleteDialog = useCodeStateStore((state) => state.openTerminalCollectionDeleteDialog);
  const openTerminalCollectionEditDialog = useCodeStateStore((state) => state.openTerminalCollectionEditDialog);
  const setSessionData = useCodeStateStore((state) => state.setSessionData);
  const setSessionDataError = useCodeStateStore((state) => state.setSessionDataError);
  const sessions = useCodeStateStore((state) => state.sessions);
  const scripts = useCodeStateStore((state) => state.scripts);
  const terminalCollections = useCodeStateStore((state) => state.terminalCollections);

  const handleEvent = useCallback((event: UIEvent) => {
    switch (event.type) {
      case 'CREATE_SESSION':
        // Initialize session creation - response will open dialog via manager
        provider.initializeSessionCreation();
        break;
        
      case 'RESUME_SESSION':
        console.log('Resume session:', event.payload.id);
        provider.sendMessage('codestate.session.resume', { id: event.payload.id });
        break;
        
      case 'DELETE_SESSION':
        console.log('Delete session:', event.payload.id);
        const sessionToDelete = sessions.find(s => s.id === event.payload.id);
        if (sessionToDelete) {
          openDeleteDialog(sessionToDelete);
        }
        break;
        
      case 'EXPORT_SESSION':
        console.log('Export session:', event.payload.id);
        provider.sendMessage('codestate.session.export', { id: event.payload.id });
        break;
        
      case 'EDIT_SESSION':
        console.log('Edit session:', event.payload.id);
        const sessionToEdit = sessions.find(s => s.id === event.payload.id);
        if (sessionToEdit) {
          openEditDialog(sessionToEdit);
        }
        break;
        
      case 'CREATE_SCRIPT':
        console.log('Create script clicked');
        // TODO: Implement script creation
        break;
        
      case 'RUN_SCRIPT':
        console.log('Run script:', event.payload.id);
        provider.sendMessage('codestate.script.resume', { id: event.payload.id });
        break;
        
      case 'DELETE_SCRIPT':
        console.log('Delete script:', event.payload.id);
        const scriptToDelete = scripts.find(s => s.id === event.payload.id);
        if (scriptToDelete) {
          openScriptDeleteDialog(scriptToDelete);
        }
        break;
        
      case 'EDIT_SCRIPT':
        console.log('Edit script:', event.payload.id);
        const scriptToEdit = scripts.find(s => s.id === event.payload.id);
        if (scriptToEdit) {
          openScriptEditDialog(scriptToEdit);
        }
        break;
        
      case 'CREATE_TERMINAL_COLLECTION':
        console.log('Create terminal collection clicked');
        // Terminal collection creation is handled directly by TerminalCollectionList
        break;
        
      case 'EXECUTE_TERMINAL_COLLECTION':
        console.log('Execute terminal collection:', event.payload.id);
        provider.sendMessage('codestate.terminal-collection.resume', { id: event.payload.id });
        break;
        
      case 'DELETE_TERMINAL_COLLECTION':
        console.log('Delete terminal collection:', event.payload.id);
        const terminalCollectionToDelete = terminalCollections.find(tc => tc.id === event.payload.id);
        if (terminalCollectionToDelete) {
          openTerminalCollectionDeleteDialog(terminalCollectionToDelete);
        }
        break;
        
      case 'EDIT_TERMINAL_COLLECTION':
        console.log('Edit terminal collection:', event.payload.id);
        const terminalCollectionToEdit = terminalCollections.find(tc => tc.id === event.payload.id);
        if (terminalCollectionToEdit) {
          openTerminalCollectionEditDialog(terminalCollectionToEdit);
        }
        break;
        
      default:
        console.warn('Unknown event type:', event);
    }
  }, [provider, setSessionData, setSessionDataError, openCreateSessionDialog, openEditDialog, openDeleteDialog, openScriptDeleteDialog, openScriptEditDialog, openTerminalCollectionDeleteDialog, openTerminalCollectionEditDialog, sessions, scripts, terminalCollections]);

  return { handleEvent };
}