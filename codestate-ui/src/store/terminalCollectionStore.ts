import { create } from 'zustand';
import type { TerminalCollectionWithScripts } from '../types/session';

interface TerminalCollectionStore {
  // Data state
  terminalCollections: TerminalCollectionWithScripts[];
  
  // Loading states
  terminalCollectionsLoading: boolean;
  
  // Error states
  terminalCollectionsError: string | null;
  
  // Data loaded flags
  terminalCollectionsLoaded: boolean;
  
  // UI State
  createTerminalCollectionDialog: {
    isOpen: boolean;
    rootPath: string | null;
  };
  
  // Temp terminal collection data for pending creation
  tempTerminalCollectionData: TerminalCollectionWithScripts | null;
  
  // Terminal collection popup state
  currentTerminalCollection: TerminalCollectionWithScripts | null;
  isTerminalCollectionDeleteDialogOpen: boolean;
  isTerminalCollectionEditDialogOpen: boolean;
  
  // Terminal collection creation feedback
  newlyCreatedTerminalCollectionId: string | null;
  showTerminalCollectionCreatedFeedback: boolean;
  
  // Actions
  setTerminalCollections: (terminalCollections: TerminalCollectionWithScripts[]) => void;
  addTerminalCollection: (terminalCollection: TerminalCollectionWithScripts) => void;
  removeTerminalCollection: (terminalCollectionId: string) => void;
  updateTerminalCollection: (terminalCollection: TerminalCollectionWithScripts) => void;
  
  setTerminalCollectionsLoading: (loading: boolean) => void;
  setTerminalCollectionsError: (error: string | null) => void;
  setTerminalCollectionsLoaded: (loaded: boolean) => void;
  
  // UI Actions
  setCreateTerminalCollectionDialog: (state: Partial<TerminalCollectionStore['createTerminalCollectionDialog']>) => void;
  openCreateTerminalCollectionDialog: (rootPath?: string) => void;
  closeCreateTerminalCollectionDialog: () => void;
  
  // Temp terminal collection actions
  setTempTerminalCollectionData: (terminalCollectionData: TerminalCollectionWithScripts | null) => void;
  addTempTerminalCollectionWithId: (terminalCollectionId: string) => void;
  
  // Terminal collection popup actions
  setCurrentTerminalCollection: (terminalCollection: TerminalCollectionWithScripts | null) => void;
  openTerminalCollectionDeleteDialog: (terminalCollection: TerminalCollectionWithScripts) => void;
  openTerminalCollectionEditDialog: (terminalCollection: TerminalCollectionWithScripts) => void;
  closeTerminalCollectionEditDialog: () => void;
  
  // Terminal collection creation feedback actions
  setNewlyCreatedTerminalCollectionId: (terminalCollectionId: string | null) => void;
  displayTerminalCollectionCreatedFeedback: (terminalCollectionId: string) => void;
  hideTerminalCollectionCreatedFeedback: () => void;
  
  // Helper methods
  isLoading: () => boolean;
  hasError: () => boolean;
  isLoaded: () => boolean;
  needsData: () => boolean;
}

export const useTerminalCollectionStore = create<TerminalCollectionStore>((set, get) => ({
  // Initial state
  terminalCollections: [],
  terminalCollectionsLoading: false,
  terminalCollectionsError: null,
  terminalCollectionsLoaded: false,
  
  // UI State
  createTerminalCollectionDialog: {
    isOpen: false,
    rootPath: null,
  },
  
  // Temp terminal collection data for pending creation
  tempTerminalCollectionData: null,
  
  // Terminal collection popup state
  currentTerminalCollection: null,
  isTerminalCollectionDeleteDialogOpen: false,
  isTerminalCollectionEditDialogOpen: false,
  
  // Terminal collection creation feedback
  newlyCreatedTerminalCollectionId: null,
  showTerminalCollectionCreatedFeedback: false,
  
  // Actions
  setTerminalCollections: (terminalCollections) => set({ terminalCollections }),
  addTerminalCollection: (terminalCollection) => set((state) => ({ 
    terminalCollections: [...state.terminalCollections, terminalCollection] 
  })),
  removeTerminalCollection: (terminalCollectionId) => set((state) => ({ 
    terminalCollections: state.terminalCollections.filter(tc => tc.id !== terminalCollectionId) 
  })),
  updateTerminalCollection: (terminalCollection) => set((state) => {
    console.log('TerminalCollectionStore: updateTerminalCollection called with:', terminalCollection);
    console.log('TerminalCollectionStore: Current terminal collections:', state.terminalCollections);
    const updatedTerminalCollections = state.terminalCollections.map(tc => tc.id === terminalCollection.id ? terminalCollection : tc);
    console.log('TerminalCollectionStore: Updated terminal collections:', updatedTerminalCollections);
    return { terminalCollections: updatedTerminalCollections };
  }),
  
  setTerminalCollectionsLoading: (loading) => set({ terminalCollectionsLoading: loading }),
  setTerminalCollectionsError: (error) => set({ terminalCollectionsError: error }),
  setTerminalCollectionsLoaded: (loaded) => set({ terminalCollectionsLoaded: loaded }),
  
  // UI Actions
  setCreateTerminalCollectionDialog: (state) => set((prev) => ({
    createTerminalCollectionDialog: { ...prev.createTerminalCollectionDialog, ...state }
  })),
  
  openCreateTerminalCollectionDialog: (rootPath) => set((prev) => ({
    createTerminalCollectionDialog: { ...prev.createTerminalCollectionDialog, isOpen: true, rootPath: rootPath || null }
  })),
  
  closeCreateTerminalCollectionDialog: () => set((prev) => ({
    createTerminalCollectionDialog: { ...prev.createTerminalCollectionDialog, isOpen: false, rootPath: null }
  })),
  
  // Temp terminal collection actions
  setTempTerminalCollectionData: (terminalCollectionData) => set({ tempTerminalCollectionData: terminalCollectionData }),
  
  addTempTerminalCollectionWithId: (terminalCollectionId) => set((state) => {
    if (state.tempTerminalCollectionData) {
      const terminalCollectionWithId = { ...state.tempTerminalCollectionData, id: terminalCollectionId };
      return {
        terminalCollections: [...state.terminalCollections, terminalCollectionWithId],
        tempTerminalCollectionData: null
      };
    }
    return state;
  }),
  
  // Terminal collection popup actions
  setCurrentTerminalCollection: (terminalCollection) => set({ currentTerminalCollection: terminalCollection }),
  
  openTerminalCollectionDeleteDialog: (terminalCollection) => set({ 
    currentTerminalCollection: terminalCollection, 
    isTerminalCollectionDeleteDialogOpen: true
  }),
  
  openTerminalCollectionEditDialog: (terminalCollection) => set({ 
    currentTerminalCollection: terminalCollection, 
    isTerminalCollectionEditDialogOpen: true
  }),
  
  closeTerminalCollectionEditDialog: () => set({ 
    isTerminalCollectionEditDialogOpen: false,
    currentTerminalCollection: null 
  }),
  
  // Terminal collection creation feedback actions
  setNewlyCreatedTerminalCollectionId: (terminalCollectionId) => set({ newlyCreatedTerminalCollectionId: terminalCollectionId }),
  
  displayTerminalCollectionCreatedFeedback: (terminalCollectionId) => set({ 
    newlyCreatedTerminalCollectionId: terminalCollectionId, 
    showTerminalCollectionCreatedFeedback: true 
  }),
  
  hideTerminalCollectionCreatedFeedback: () => set({ 
    newlyCreatedTerminalCollectionId: null, 
    showTerminalCollectionCreatedFeedback: false 
  }),
  
  // Helper methods
  isLoading: () => get().terminalCollectionsLoading,
  hasError: () => !!get().terminalCollectionsError,
  isLoaded: () => get().terminalCollectionsLoaded,
  needsData: () => !get().terminalCollectionsLoaded && !get().terminalCollectionsLoading
}));