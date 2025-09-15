import { useConfigStore } from '../store/combinedStore';

export class ConfigManager {

  // Handle config init response
  handleConfigInitResponse(data: any): void {
    console.log('ConfigManager: Received config init response', data);
    console.log('ConfigManager: data.status', data.status);
    console.log('ConfigManager: data.payload', data.payload);
    const configStore = useConfigStore.getState();
    if (data.status === 'success') {
      console.log('ConfigManager: Setting config data', data.payload.config);
      configStore.setConfigData(data.payload.config);
    } else if (data.payload && data.payload.error) {
      console.log('ConfigManager: Setting config error', data.payload.error);
      configStore.setConfigDataError(data.payload.error);
    }
  }

  // Handle config update response
  handleConfigUpdateResponse(data: any): void {
    console.log('ConfigManager: Received config update response', data);
    const configStore = useConfigStore.getState();
    if (data.status === 'success') {
      // Close the config dialog
      configStore.closeConfigDialog();
      
      // Update the config data in the store
      configStore.setConfigData(data.payload.config);
    } else if (data.payload && data.payload.error) {
      // Handle error case - keep dialog open to show error
      console.error('Config update failed:', data.payload.error);
    }
  }
}