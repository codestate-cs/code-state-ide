import { create } from 'zustand';

interface ConfigStore {
  // Current project state
  currentProjectRoot: string | null;
  
  // UI State
  configDialog: {
    isOpen: boolean;
    configData: any | null;
    configDataError: string | null;
  };
  
  // Actions
  setCurrentProjectRoot: (rootPath: string | null) => void;
  
  // Config dialog actions
  setConfigDialog: (state: Partial<ConfigStore['configDialog']>) => void;
  openConfigDialog: () => void;
  closeConfigDialog: () => void;
  setConfigData: (data: any | null) => void;
  setConfigDataError: (error: string | null) => void;
}

export const useConfigStore = create<ConfigStore>((set, get) => ({
  // Initial state
  currentProjectRoot: null,
  
  // UI State
  configDialog: {
    isOpen: false,
    configData: null,
    configDataError: null,
  },
  
  // Actions
  setCurrentProjectRoot: (rootPath) => {
    console.log('ConfigStore: setCurrentProjectRoot called with:', rootPath);
    set({ currentProjectRoot: rootPath });
  },
  
  // Config dialog actions
  setConfigDialog: (state) => set((prev) => ({
    configDialog: { ...prev.configDialog, ...state }
  })),
  
  openConfigDialog: () => set((prev) => ({
    configDialog: { ...prev.configDialog, isOpen: true }
  })),
  
  closeConfigDialog: () => set((prev) => ({
    configDialog: { ...prev.configDialog, isOpen: false, configData: null, configDataError: null }
  })),
  
  setConfigData: (data) => {
    console.log('ConfigStore: setConfigData called with', data);
    set((prev) => ({
      configDialog: { ...prev.configDialog, configData: data, configDataError: null }
    }));
  },
  
  setConfigDataError: (error) => {
    console.log('ConfigStore: setConfigDataError called with', error);
    set((prev) => ({
      configDialog: { ...prev.configDialog, configDataError: error, configData: null }
    }));
  }
}));