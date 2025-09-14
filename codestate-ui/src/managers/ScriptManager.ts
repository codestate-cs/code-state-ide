import { useCodeStateStore } from '../store/codestateStore';

export class ScriptManager {
  private store = useCodeStateStore.getState();

  // Script initialization
  initializeScripts(): void {
    console.log('ScriptManager: Initializing scripts');
    // This will be called by the provider to trigger script init
  }

  // Handle script init response
  handleScriptsInitResponse(data: any): void {
    console.log('ScriptManager: Received scripts init response', data);
    this.store.setScripts(data.scripts || []);
    this.store.setScriptsLoaded(true);
    this.store.setScriptsLoading(false);
  }

  // Handle script create response
  handleScriptCreateResponse(data: any): void {
    console.log('ScriptManager: Received script create response', data);
    if (data.payload && data.payload.success) {
      // Add the temp script with the received ID to the store
      if (data.payload.id) {
        this.store.addTempScriptWithId(data.payload.id);
        this.store.displayScriptCreatedFeedback(data.payload.id);
        // Close the create script dialog
        this.store.closeCreateScriptDialog();
      }
    } else if (data.payload && data.payload.error) {
      // Handle error case
      console.error('Script creation failed:', data.payload.error);
    }
  }

  // Handle script delete response
  handleScriptDeleteResponse(data: any): void {
    console.log('ScriptManager: Received script delete response', data);
    if (data.status === 'success') {
      this.store.removeScript(data.payload.id);
    }
  }

  // Handle script update response
  handleScriptUpdateResponse(data: any): void {
    console.log('ScriptManager: Received script update response', data);
    if (data.status === 'success') {
      // Get the current state to access the updated currentScript BEFORE closing dialog
      const currentState = useCodeStateStore.getState();
      const currentScript = currentState.currentScript;
      console.log('ScriptManager: Current script before closing dialog:', currentScript);
      
      // Close the edit dialog
      this.store.closeAllDialogs();
      
      // Update the script in the store with the new data
      if (currentScript && data.payload && data.payload.id) {
        // Create updated script with the same ID but new data
        const updatedScript = {
          ...currentScript,
          id: data.payload.id
        };
        console.log('ScriptManager: Updating script in store:', updatedScript);
        currentState.updateScript(updatedScript);
      } else {
        console.log('ScriptManager: No currentScript or payload.id found');
        console.log('ScriptManager: currentScript:', currentScript);
        console.log('ScriptManager: data.payload:', data.payload);
      }
    } else if (data.payload && data.payload.error) {
      // Handle error case
      console.error('Script update failed:', data.payload.error);
    }
  }
}