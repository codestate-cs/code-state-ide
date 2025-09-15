import { useTerminalCollectionStore } from '../store/combinedStore';

export class TerminalCollectionManager {

  // Handle terminal collection initialization response
  handleTerminalCollectionsInitResponse(data: any): void {
    console.log('TerminalCollectionManager: Received terminal collections init response', data);
    const terminalCollectionStore = useTerminalCollectionStore.getState();
    if (data.status === 'success' && data.payload && data.payload.terminalCollections) {
      terminalCollectionStore.setTerminalCollections(data.payload.terminalCollections);
      terminalCollectionStore.setTerminalCollectionsLoaded(true);
      terminalCollectionStore.setTerminalCollectionsLoading(false);
    } else {
      terminalCollectionStore.setTerminalCollectionsError(data.payload?.error || 'Failed to load terminal collections');
      terminalCollectionStore.setTerminalCollectionsLoading(false);
    }
  }

  // Handle terminal collection creation response
  handleTerminalCollectionCreateResponse(data: any): void {
    console.log('TerminalCollectionManager: Received terminal collection create response', data);
    const terminalCollectionStore = useTerminalCollectionStore.getState();
    if (data.status === 'success' && data.payload && data.payload.id) {
      // Add the temp terminal collection with the new ID
      terminalCollectionStore.addTempTerminalCollectionWithId(data.payload.id);
      // Show feedback
      terminalCollectionStore.displayTerminalCollectionCreatedFeedback(data.payload.id);
      // Close the dialog
      terminalCollectionStore.closeCreateTerminalCollectionDialog();
    } else {
      console.error('Terminal collection creation failed:', data.payload?.error);
    }
  }

  // Handle terminal collection deletion response
  handleTerminalCollectionDeleteResponse(data: any): void {
    console.log('TerminalCollectionManager: Received terminal collection delete response', data);
    const terminalCollectionStore = useTerminalCollectionStore.getState();
    if (data.status === 'success') {
      terminalCollectionStore.removeTerminalCollection(data.payload.id);
    }
  }

  // Handle terminal collection update response
  handleTerminalCollectionUpdateResponse(data: any): void {
    console.log('TerminalCollectionManager: Received terminal collection update response', data);
    const terminalCollectionStore = useTerminalCollectionStore.getState();
    if (data.status === 'success') {
      // Get the current terminal collection before closing dialog
      const currentTerminalCollection = terminalCollectionStore.currentTerminalCollection;
      console.log('TerminalCollectionManager: Current terminal collection before closing dialog:', currentTerminalCollection);
      
      // Close the edit dialog
      terminalCollectionStore.closeTerminalCollectionEditDialog();
      
      // Update the terminal collection in the store with the new data
      if (currentTerminalCollection && data.payload && data.payload.id) {
        // Create updated terminal collection with the same ID but new data
        const updatedTerminalCollection = {
          ...currentTerminalCollection,
          id: data.payload.id
        };
        console.log('TerminalCollectionManager: Updating terminal collection in store:', updatedTerminalCollection);
        terminalCollectionStore.updateTerminalCollection(updatedTerminalCollection);
      } else {
        console.log('TerminalCollectionManager: No currentTerminalCollection or payload.id found');
        console.log('TerminalCollectionManager: currentTerminalCollection:', currentTerminalCollection);
        console.log('TerminalCollectionManager: data.payload:', data.payload);
      }
    } else if (data.payload && data.payload.error) {
      // Handle error case
      console.error('Terminal collection update failed:', data.payload.error);
    }
  }

  // Handle terminal collection resume response
  handleTerminalCollectionResumeResponse(data: any): void {
    console.log('TerminalCollectionManager: Received terminal collection resume response', data);
    if (data.status === 'success') {
      console.log('Terminal collection execution started successfully');
    } else {
      console.error('Terminal collection execution failed:', data.payload?.error);
    }
  }
}