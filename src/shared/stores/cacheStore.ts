import { create } from 'zustand';
import { Session, Script, Config, TerminalCollectionWithScripts } from '@codestate/core';

// Cache state interface
export interface CacheState {
  // Data
  sessions: Session[];
  scripts: Script[];
  config: Config | null;
  terminalCollections: TerminalCollectionWithScripts[];
  
  // Loading states
  loading: {
    sessions: boolean;
    scripts: boolean;
    config: boolean;
    terminalCollections: boolean;
  };
  
  // Error states
  errors: {
    sessions: string | null;
    scripts: string | null;
    config: string | null;
    terminalCollections: string | null;
  };
  
  // Cache metadata
  lastUpdated: {
    sessions: number | null;
    scripts: number | null;
    config: number | null;
    terminalCollections: number | null;
  };
  
  // Actions
  setSessions: (sessions: Session[]) => void;
  setScripts: (scripts: Script[]) => void;
  setConfig: (config: Config) => void;
  setTerminalCollections: (terminalCollections: TerminalCollectionWithScripts[]) => void;
  
  setLoading: (key: keyof CacheState['loading'], loading: boolean) => void;
  setError: (key: keyof CacheState['errors'], error: string | null) => void;
  setLastUpdated: (key: keyof CacheState['lastUpdated'], timestamp: number) => void;
  
  // Cache management
  clearCache: () => void;
  clearSessionsCache: () => void;
  clearScriptsCache: () => void;
  clearConfigCache: () => void;
  clearTerminalCollectionsCache: () => void;
  
  // Utility methods
  isStale: (key: keyof CacheState['lastUpdated'], ttlMs?: number) => boolean;
  hasData: (key: 'sessions' | 'scripts' | 'config' | 'terminalCollections') => boolean;
}

// Default TTL values (in milliseconds)
const DEFAULT_TTL: Record<keyof CacheState['lastUpdated'], number> = {
  sessions: 5 * 60 * 1000, // 5 minutes
  scripts: 10 * 60 * 1000, // 10 minutes
  config: 30 * 60 * 1000,  // 30 minutes
  terminalCollections: 10 * 60 * 1000, // 10 minutes
};

export const useCacheStore = create<CacheState>((set, get) => ({
  // Initial state
  sessions: [],
  scripts: [],
  config: null,
  terminalCollections: [],
  
  loading: {
    sessions: false,
    scripts: false,
    config: false,
    terminalCollections: false,
  },
  
  errors: {
    sessions: null,
    scripts: null,
    config: null,
    terminalCollections: null,
  },
  
  lastUpdated: {
    sessions: null,
    scripts: null,
    config: null,
    terminalCollections: null,
  },
  
  // Actions
  setSessions: (sessions: Session[]) => set({ 
    sessions,
    lastUpdated: { ...get().lastUpdated, sessions: Date.now() },
    errors: { ...get().errors, sessions: null }
  }),
  
  setScripts: (scripts: Script[]) => set({ 
    scripts,
    lastUpdated: { ...get().lastUpdated, scripts: Date.now() },
    errors: { ...get().errors, scripts: null }
  }),
  
  setConfig: (config: Config) => set({ 
    config,
    lastUpdated: { ...get().lastUpdated, config: Date.now() },
    errors: { ...get().errors, config: null }
  }),
  
  setTerminalCollections: (terminalCollections: TerminalCollectionWithScripts[]) => set({ 
    terminalCollections,
    lastUpdated: { ...get().lastUpdated, terminalCollections: Date.now() },
    errors: { ...get().errors, terminalCollections: null }
  }),
  
  setLoading: (key: keyof CacheState['loading'], loading: boolean) => set((state: CacheState) => ({
    loading: { ...state.loading, [key]: loading }
  })),
  
  setError: (key: keyof CacheState['errors'], error: string | null) => set((state: CacheState) => ({
    errors: { ...state.errors, [key]: error }
  })),
  
  setLastUpdated: (key: keyof CacheState['lastUpdated'], timestamp: number) => set((state: CacheState) => ({
    lastUpdated: { ...state.lastUpdated, [key]: timestamp }
  })),
  
  // Cache management
  clearCache: () => set({
    sessions: [],
    scripts: [],
    config: null,
    terminalCollections: [],
    lastUpdated: {
      sessions: null,
      scripts: null,
      config: null,
      terminalCollections: null,
    },
    errors: {
      sessions: null,
      scripts: null,
      config: null,
      terminalCollections: null,
    }
  }),
  
  clearSessionsCache: () => set({
    sessions: [],
    lastUpdated: { ...get().lastUpdated, sessions: null },
    errors: { ...get().errors, sessions: null }
  }),
  
  clearScriptsCache: () => set({
    scripts: [],
    lastUpdated: { ...get().lastUpdated, scripts: null },
    errors: { ...get().errors, scripts: null }
  }),
  
  clearConfigCache: () => set({
    config: null,
    lastUpdated: { ...get().lastUpdated, config: null },
    errors: { ...get().errors, config: null }
  }),
  
  clearTerminalCollectionsCache: () => set({
    terminalCollections: [],
    lastUpdated: { ...get().lastUpdated, terminalCollections: null },
    errors: { ...get().errors, terminalCollections: null }
  }),
  
  // Utility methods
  isStale: (key: keyof CacheState['lastUpdated'], ttlMs?: number) => {
    const lastUpdated = get().lastUpdated[key];
    if (!lastUpdated) {
      return true;
    }
    
    const ttl = ttlMs || DEFAULT_TTL[key] || DEFAULT_TTL.sessions;
    return Date.now() - lastUpdated > ttl;
  },
  
  hasData: (key: 'sessions' | 'scripts' | 'config' | 'terminalCollections') => {
    if (key === 'config') {
      return get().config !== null;
    }
    if (key === 'sessions') {
      return get().sessions && get().sessions.length > 0;
    }
    if (key === 'scripts') {
      return get().scripts && get().scripts.length > 0;
    }
    if (key === 'terminalCollections') {
      return get().terminalCollections && get().terminalCollections.length > 0;
    }
    return false;
  }
})); 