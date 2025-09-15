import { useScriptStore } from '../store/combinedStore';

export class ScriptManager {

  // Script initialization
  initializeScripts(): void {
    console.log('ScriptManager: Initializing scripts');
    // This will be called by the provider to trigger script init
  }

  // Handle script init response
  handleScriptsInitResponse(data: any): void {
    console.log('ScriptManager: Received scripts init response', data);
    const scriptStore = useScriptStore.getState();
    scriptStore.setScripts(data.scripts || []);
    scriptStore.setScriptsLoaded(true);
    scriptStore.setScriptsLoading(false);
  }

  // Handle script create response
  handleScriptCreateResponse(data: any): void {
    console.log('ScriptManager: Received script create response', data);
    const scriptStore = useScriptStore.getState();
    
    if (data.payload && data.payload.success) {
      // Add the temp script with the received ID to the store
      if (data.payload.id) {
        scriptStore.addTempScriptWithId(data.payload.id);
        scriptStore.displayScriptCreatedFeedback(data.payload.id);
        // Close the create script dialog
        scriptStore.closeCreateScriptDialog();
      }
    } else if (data.payload && data.payload.error) {
      // Handle error case
      console.error('Script creation failed:', data.payload.error);
    }
  }

  // Handle script delete response
  handleScriptDeleteResponse(data: any): void {
    console.log('ScriptManager: Received script delete response', data);
    const scriptStore = useScriptStore.getState();
    if (data.status === 'success') {
      scriptStore.removeScript(data.payload.id);
    }
  }

  // Handle script update response
  handleScriptUpdateResponse(data: any): void {
    console.log('ScriptManager: Received script update response', data);
    const scriptStore = useScriptStore.getState();
    if (data.status === 'success') {
      // Get the current script before closing dialog
      const currentScript = scriptStore.currentScript;
      console.log('ScriptManager: Current script before closing dialog:', currentScript);
      
      // Close the edit dialog
      scriptStore.closeScriptEditDialog();
      
      // Update the script in the store with the new data
      if (currentScript && data.payload && data.payload.id) {
        // Create updated script with the same ID but new data
        const updatedScript = {
          ...currentScript,
          id: data.payload.id
        };
        console.log('ScriptManager: Updating script in store:', updatedScript);
        scriptStore.updateScript(updatedScript);
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