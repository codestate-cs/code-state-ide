// Optimized component exports for tree shaking
// Core UI components
export { Accordion } from './Accordion';
export { Card, CardHeader, CardContent, CardFooter } from './Card';
export { Tabs } from './Tabs';
export { AlertDialog } from './AlertDialog';
export { Dialog } from './Dialog';

// Application components (lazy loaded)
export { SessionCard } from './SessionCard';
export { ScriptCard } from './ScriptCard';
export { Header } from './Header';
export { MainTabs } from './MainTabs';
export { PopupManager } from './PopupManager';

// Dialog components (lazy loaded)
export { CreateSessionDialog } from './CreateSessionDialog';
export { CreateScriptDialog } from './CreateScriptDialog';
export { CreateTerminalCollectionDialog } from './CreateTerminalCollectionDialog';
export { ConfigDialog } from './ConfigDialog';

// List components (lazy loaded)
export { SessionList } from './SessionList';
export { ScriptList } from './ScriptList';
export { TerminalCollectionList } from './TerminalCollectionList';

// Theme component
export { ThemeSwitcher } from './ThemeSwitcher';

// Component types
export type { default as AccordionItem } from './Accordion';
export type { default as TabItem } from './Tabs';
export type { default as Theme } from './ThemeSwitcher';