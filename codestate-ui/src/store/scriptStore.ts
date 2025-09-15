import { create } from 'zustand';
import type { Script } from '../types/session';

interface ScriptStore {
  // Data state
  scripts: Script[];
  
  // Loading states
  scriptsLoading: boolean;
  
  // Error states
  scriptsError: string | null;
  
  // Data loaded flags
  scriptsLoaded: boolean;
  
  // UI State
  createScriptDialog: {
    isOpen: boolean;
    rootPath: string | null;
  };
  
  // Temp script data for pending creation
  tempScriptData: Script | null;
  
  // Script popup state
  currentScript: Script | null;
  isScriptDeleteDialogOpen: boolean;
  isScriptEditDialogOpen: boolean;
  
  // Script creation feedback
  newlyCreatedScriptId: string | null;
  showScriptCreatedFeedback: boolean;
  
  // Actions
  setScripts: (scripts: Script[]) => void;
  addScript: (script: Script) => void;
  removeScript: (scriptId: string) => void;
  updateScript: (script: Script) => void;
  
  setScriptsLoading: (loading: boolean) => void;
  setScriptsError: (error: string | null) => void;
  setScriptsLoaded: (loaded: boolean) => void;
  
  // UI Actions
  setCreateScriptDialog: (state: Partial<ScriptStore['createScriptDialog']>) => void;
  openCreateScriptDialog: (rootPath?: string) => void;
  closeCreateScriptDialog: () => void;
  
  // Temp script actions
  setTempScriptData: (scriptData: Script | null) => void;
  addTempScriptWithId: (scriptId: string) => void;
  
  // Script popup actions
  setCurrentScript: (script: Script | null) => void;
  openScriptDeleteDialog: (script: Script) => void;
  closeScriptDeleteDialog: () => void;
  openScriptEditDialog: (script: Script) => void;
  closeScriptEditDialog: () => void;
  
  // Script creation feedback actions
  setNewlyCreatedScriptId: (scriptId: string | null) => void;
  displayScriptCreatedFeedback: (scriptId: string) => void;
  hideScriptCreatedFeedback: () => void;
  
  // Helper methods
  isLoading: () => boolean;
  hasError: () => boolean;
  isLoaded: () => boolean;
  needsData: () => boolean;
}

export const useScriptStore = create<ScriptStore>((set, get) => ({
  // Initial state
  scripts: [],
  scriptsLoading: false,
  scriptsError: null,
  scriptsLoaded: false,
  
  // UI State
  createScriptDialog: {
    isOpen: false,
    rootPath: null,
  },
  
  // Temp script data for pending creation
  tempScriptData: null,
  
  // Script popup state
  currentScript: null,
  isScriptDeleteDialogOpen: false,
  isScriptEditDialogOpen: false,
  
  // Script creation feedback
  newlyCreatedScriptId: null,
  showScriptCreatedFeedback: false,
  
  // Actions
  setScripts: (scripts) => set({ scripts }),
  addScript: (script) => set((state) => ({ scripts: [...state.scripts, script] })),
  removeScript: (scriptId) => set((state) => ({ 
    scripts: state.scripts.filter(s => s.id !== scriptId) 
  })),
  updateScript: (script) => set((state) => {
    console.log('ScriptStore: updateScript called with:', script);
    console.log('ScriptStore: Current scripts:', state.scripts);
    const updatedScripts = state.scripts.map(s => s.id === script.id ? script : s);
    console.log('ScriptStore: Updated scripts:', updatedScripts);
    return { scripts: updatedScripts };
  }),
  
  setScriptsLoading: (loading) => set({ scriptsLoading: loading }),
  setScriptsError: (error) => set({ scriptsError: error }),
  setScriptsLoaded: (loaded) => set({ scriptsLoaded: loaded }),
  
  // UI Actions
  setCreateScriptDialog: (state) => set((prev) => ({
    createScriptDialog: { ...prev.createScriptDialog, ...state }
  })),
  
  openCreateScriptDialog: (rootPath) => set((prev) => ({
    createScriptDialog: { ...prev.createScriptDialog, isOpen: true, rootPath: rootPath || null }
  })),
  
  closeCreateScriptDialog: () => set((prev) => ({
    createScriptDialog: { ...prev.createScriptDialog, isOpen: false, rootPath: null }
  })),
  
  // Temp script actions
  setTempScriptData: (scriptData) => set({ tempScriptData: scriptData }),
  
  addTempScriptWithId: (scriptId) => set((state) => {
    if (state.tempScriptData) {
      const scriptWithId = { ...state.tempScriptData, id: scriptId };
      return {
        scripts: [...state.scripts, scriptWithId],
        tempScriptData: null
      };
    }
    return state;
  }),
  
  // Script popup actions
  setCurrentScript: (script) => set({ currentScript: script }),
  
  openScriptDeleteDialog: (script) => set({ 
    currentScript: script, 
    isScriptDeleteDialogOpen: true,
    isScriptEditDialogOpen: false  // Close edit dialog when opening delete
  }),
  
  closeScriptDeleteDialog: () => set({ 
    isScriptDeleteDialogOpen: false,
    currentScript: null 
  }),
  
  openScriptEditDialog: (script) => set({ 
    currentScript: script, 
    isScriptEditDialogOpen: true,
    isScriptDeleteDialogOpen: false  // Close delete dialog when opening edit
  }),
  
  closeScriptEditDialog: () => set({ 
    isScriptEditDialogOpen: false,
    currentScript: null 
  }),
  
  // Script creation feedback actions
  setNewlyCreatedScriptId: (scriptId) => set({ newlyCreatedScriptId: scriptId }),
  
  displayScriptCreatedFeedback: (scriptId) => set({ 
    newlyCreatedScriptId: scriptId, 
    showScriptCreatedFeedback: true 
  }),
  
  hideScriptCreatedFeedback: () => set({ 
    newlyCreatedScriptId: null, 
    showScriptCreatedFeedback: false 
  }),
  
  // Helper methods
  isLoading: () => get().scriptsLoading,
  hasError: () => !!get().scriptsError,
  isLoaded: () => get().scriptsLoaded,
  needsData: () => !get().scriptsLoaded && !get().scriptsLoading
}));