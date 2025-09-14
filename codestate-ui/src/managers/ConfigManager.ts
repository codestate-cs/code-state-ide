import { useCodeStateStore } from '../store/codestateStore';

export class ConfigManager {
  private store = useCodeStateStore.getState();

  // Handle config init response
  handleConfigInitResponse(data: any): void {
    console.log('ConfigManager: Received config init response', data);
    console.log('ConfigManager: data.status', data.status);
    console.log('ConfigManager: data.payload', data.payload);
    if (data.status === 'success') {
      console.log('ConfigManager: Setting config data', data.payload.config);
      this.store.setConfigData(data.payload.config);
    } else if (data.payload && data.payload.error) {
      console.log('ConfigManager: Setting config error', data.payload.error);
      this.store.setConfigDataError(data.payload.error);
    }
  }

  // Handle config update response
  handleConfigUpdateResponse(data: any): void {
    console.log('ConfigManager: Received config update response', data);
    if (data.status === 'success') {
      // Close the config dialog
      this.store.closeConfigDialog();
      
      // Update the config data in the store
      this.store.setConfigData(data.payload.config);
    } else if (data.payload && data.payload.error) {
      // Handle error case - keep dialog open to show error
      console.error('Config update failed:', data.payload.error);
    }
  }
}