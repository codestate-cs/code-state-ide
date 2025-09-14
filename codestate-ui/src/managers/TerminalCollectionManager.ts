import { useCodeStateStore } from '../store/codestateStore';
import type { TerminalCollectionWithScripts } from '../types/session';

export class TerminalCollectionManager {
  private store: ReturnType<typeof useCodeStateStore.getState>;

  constructor() {
    this.store = useCodeStateStore.getState();
  }

  // Handle terminal collection initialization response
  handleTerminalCollectionsInitResponse(data: any): void {
    console.log('TerminalCollectionManager: Received terminal collections init response', data);
    if (data.status === 'success' && data.payload && data.payload.terminalCollections) {
      this.store.setTerminalCollections(data.payload.terminalCollections);
      this.store.setTerminalCollectionsLoaded(true);
      this.store.setTerminalCollectionsLoading(false);
    } else {
      this.store.setTerminalCollectionsError(data.payload?.error || 'Failed to load terminal collections');
      this.store.setTerminalCollectionsLoading(false);
    }
  }

  // Handle terminal collection creation response
  handleTerminalCollectionCreateResponse(data: any): void {
    console.log('TerminalCollectionManager: Received terminal collection create response', data);
    if (data.status === 'success' && data.payload && data.payload.id) {
      // Add the temp terminal collection with the new ID
      this.store.addTempTerminalCollectionWithId(data.payload.id);
      // Show feedback
      this.store.displayTerminalCollectionCreatedFeedback(data.payload.id);
      // Close the dialog
      this.store.closeCreateTerminalCollectionDialog();
    } else {
      console.error('Terminal collection creation failed:', data.payload?.error);
    }
  }

  // Handle terminal collection deletion response
  handleTerminalCollectionDeleteResponse(data: any): void {
    console.log('TerminalCollectionManager: Received terminal collection delete response', data);
    if (data.status === 'success') {
      this.store.removeTerminalCollection(data.payload.id);
    }
  }

  // Handle terminal collection update response
  handleTerminalCollectionUpdateResponse(data: any): void {
    console.log('TerminalCollectionManager: Received terminal collection update response', data);
    if (data.status === 'success') {
      // Get the current state to access the updated currentTerminalCollection BEFORE closing dialog
      const currentState = useCodeStateStore.getState();
      const currentTerminalCollection = currentState.currentTerminalCollection;
      console.log('TerminalCollectionManager: Current terminal collection before closing dialog:', currentTerminalCollection);
      
      // Close the edit dialog
      this.store.closeAllDialogs();
      
      // Update the terminal collection in the store with the new data
      if (currentTerminalCollection && data.payload && data.payload.id) {
        // Create updated terminal collection with the same ID but new data
        const updatedTerminalCollection = {
          ...currentTerminalCollection,
          id: data.payload.id
        };
        console.log('TerminalCollectionManager: Updating terminal collection in store:', updatedTerminalCollection);
        currentState.updateTerminalCollection(updatedTerminalCollection);
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