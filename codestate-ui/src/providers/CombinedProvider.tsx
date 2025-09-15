import { memo } from 'preact/compat';
import { SessionProvider } from './SessionProvider';
import { ScriptProvider } from './ScriptProvider';
import { TerminalCollectionProvider } from './TerminalCollectionProvider';
import { ConfigProvider } from './ConfigProvider';

interface CombinedProviderProps {
  children: React.ReactNode;
}

export const CombinedProvider = memo(function CombinedProvider({ children }: CombinedProviderProps) {
  return (
    <ConfigProvider>
      <SessionProvider>
        <ScriptProvider>
          <TerminalCollectionProvider>
            {children}
          </TerminalCollectionProvider>
        </ScriptProvider>
      </SessionProvider>
    </ConfigProvider>
  );
});

// Re-export individual providers and contexts for convenience
export { SessionProvider, useSessionContext } from './SessionProvider';
export { ScriptProvider, useScriptContext } from './ScriptProvider';
export { TerminalCollectionProvider, useTerminalCollectionContext } from './TerminalCollectionProvider';
export { ConfigProvider, useConfigContext } from './ConfigProvider';