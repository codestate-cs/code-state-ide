// Optimized provider exports for tree shaking
// Individual providers (preferred for tree shaking)
export { SessionProvider, useSessionContext } from './SessionProvider';
export { ScriptProvider, useScriptContext } from './ScriptProvider';
export { TerminalCollectionProvider, useTerminalCollectionContext } from './TerminalCollectionProvider';
export { ConfigProvider, useConfigContext } from './ConfigProvider';

// Combined provider for convenience
export { CombinedProvider } from './CombinedProvider';

// Data providers
export { VSCodeProvider } from './VSCodeProvider';

// Provider types
export type { DataProvider, Theme } from './DataProvider';