# CodeState UI Performance Optimization Guide

This document outlines comprehensive performance optimization strategies for the CodeState UI to reduce renders and improve overall application performance.

## Table of Contents

1. [Zustand Store Optimization](#1-zustand-store-optimization)
2. [Component Memoization](#2-component-memoization)
3. [Event Handler Optimization](#3-event-handler-optimization)
4. [Data Loading Optimization](#4-data-loading-optimization)
5. [PopupManager Optimization](#5-popupmanager-optimization)
6. [MainTabs Optimization](#6-maintabs-optimization)
7. [SessionCard Optimization](#7-sessioncard-optimization)
8. [Provider Pattern Optimization](#8-provider-pattern-optimization)
9. [CSS and DOM Optimization](#9-css-and-dom-optimization)
10. [Bundle Optimization](#10-bundle-optimization)
11. [Implementation Priority](#11-implementation-priority)

## 1. Zustand Store Optimization

### Current Issues
- The store has a massive interface (600+ lines) with many individual selectors
- Components subscribe to entire store sections instead of specific fields
- Multiple components re-render when unrelated state changes

### Optimizations

#### Split the Monolithic Store
Break the current `useCodeStateStore` into separate domain-specific stores:

```typescript
// stores/sessionStore.ts
export const useSessionStore = create<SessionStore>((set, get) => ({
  sessions: [],
  sessionsLoading: false,
  sessionsError: null,
  sessionsLoaded: false,
  // ... session-specific actions
}));

// stores/scriptStore.ts
export const useScriptStore = create<ScriptStore>((set, get) => ({
  scripts: [],
  scriptsLoading: false,
  scriptsError: null,
  scriptsLoaded: false,
  // ... script-specific actions
}));

// stores/terminalCollectionStore.ts
export const useTerminalCollectionStore = create<TerminalCollectionStore>((set, get) => ({
  terminalCollections: [],
  terminalCollectionsLoading: false,
  terminalCollectionsError: null,
  terminalCollectionsLoaded: false,
  // ... terminal collection-specific actions
}));

// stores/uiDialogStore.ts
export const useUIDialogStore = create<UIDialogStore>((set, get) => ({
  createSessionDialog: { isOpen: false, sessionData: null, sessionDataError: null },
  createScriptDialog: { isOpen: false, rootPath: null },
  // ... dialog-specific actions
}));

// stores/configStore.ts
export const useConfigStore = create<ConfigStore>((set, get) => ({
  configDialog: { isOpen: false, configData: null, configDataError: null },
  currentProjectRoot: null,
  // ... config-specific actions
}));
```

#### Use Shallow Equality Selectors
Prevent unnecessary re-renders with shallow comparison:

```typescript
import { shallow } from 'zustand/shallow';

// Instead of subscribing to entire objects
const sessions = useCodeStateStore(state => state.sessions);

// Use shallow comparison for arrays/objects
const sessions = useCodeStateStore(state => state.sessions, shallow);

// For multiple values
const { sessions, sessionsLoading } = useCodeStateStore(
  state => ({ 
    sessions: state.sessions, 
    sessionsLoading: state.sessionsLoading 
  }),
  shallow
);
```

## 2. Component Memoization

### Current Issues
- No memoization of expensive components like `SessionCard`, `SessionList`
- Complex filtering and grouping operations run on every render
- Event handlers recreated on every render

### Optimizations

#### Memoize Expensive List Components
```typescript
import { memo } from 'preact/compat';

export const SessionList = memo(({ sessions, isLoading, onEvent }) => {
  // Component logic
});

export const SessionCard = memo(({ session, isNewlyCreated }) => {
  // Component logic
});
```

#### Memoize Filtered Data
```typescript
import { useMemo } from 'preact/hooks';

const filteredSessions = useMemo(() => 
  sessions.filter(session => 
    session.name.toLowerCase().includes(searchTerm.toLowerCase())
  ), [sessions, searchTerm]
);
```

#### Memoize Grouped Data
```typescript
const sessionGroups = useMemo(() => 
  groupSessionsByPath(filteredSessions), 
  [filteredSessions]
);

const accordionItems = useMemo(() => 
  sortedGroupEntries.map(([rootPath, groupSessions]) => ({
    // ... accordion item creation
  })), [sortedGroupEntries, currentProjectRoot, newlyCreatedSessionId, showSessionCreatedFeedback]
);
```

## 3. Event Handler Optimization

### Current Issues
- Event handlers in `useUIEvents` recreate on every render due to dependencies
- Event delegation in `SessionList` processes every click event

### Optimizations

#### Stable Event Handlers with useCallback
```typescript
import { useCallback } from 'preact/hooks';

const handleEvent = useCallback((event: UIEvent) => {
  switch (event.type) {
    case 'CREATE_SESSION':
      provider.initializeSessionCreation();
      break;
    case 'RESUME_SESSION':
      provider.sendMessage('codestate.session.resume', { id: event.payload.id });
      break;
    // ... other cases
  }
}, [provider]); // Minimal dependencies
```

#### Optimize Event Delegation
```typescript
import { useRef, useEffect } from 'preact/hooks';

const containerRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const handleClick = (e: Event) => {
    const target = e.target as HTMLElement;
    const action = target.dataset.action;
    const sessionId = target.dataset.sessionId;
    
    if (!action) return;
    
    switch (action) {
      case 'create-session':
        onEvent({ type: 'CREATE_SESSION' });
        break;
      case 'resume-session':
        if (sessionId) onEvent({ type: 'RESUME_SESSION', payload: { id: sessionId } });
        break;
      // ... other cases
    }
  };
  
  const container = containerRef.current;
  container?.addEventListener('click', handleClick);
  
  return () => container?.removeEventListener('click', handleClick);
}, [onEvent]);
```

## 4. Data Loading Optimization

### Current Issues
- Data loading triggers re-renders of entire component tree
- Multiple `useEffect` hooks in `useDataLoader` cause cascading renders
- No virtualization for large lists

### Optimizations

#### Implement Data Virtualization
```typescript
import { FixedSizeList as List } from 'react-window';

const VirtualizedSessionList = ({ sessions }) => (
  <List
    height={600}
    itemCount={sessions.length}
    itemSize={200}
    itemData={sessions}
  >
    {({ index, style, data }) => (
      <div style={style}>
        <SessionCard session={data[index]} />
      </div>
    )}
  </List>
);
```

#### Batch Data Updates
```typescript
// In store actions
const batchUpdateSessions = (updates: SessionUpdate[]) => {
  set((state) => ({
    sessions: state.sessions.map(session => {
      const update = updates.find(u => u.id === session.id);
      return update ? { ...session, ...update } : session;
    })
  }));
};
```

#### Implement Pagination
```typescript
interface PaginatedData {
  items: SessionWithFullData[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

const usePaginatedSessions = (pageSize = 20) => {
  const [data, setData] = useState<PaginatedData>({
    items: [],
    totalCount: 0,
    page: 1,
    pageSize,
    hasMore: true
  });
  
  const loadMore = useCallback(() => {
    if (!data.hasMore) return;
    
    provider.sendMessage('codestate.sessions.load', {
      page: data.page + 1,
      pageSize: data.pageSize
    });
  }, [data.page, data.pageSize, data.hasMore, provider]);
  
  return { ...data, loadMore };
};
```

## 5. PopupManager Optimization

### Current Issues
- `PopupManager` subscribes to many store selectors
- All dialog components render even when closed
- No lazy loading of dialog components

### Optimizations

#### Lazy Load Dialog Components
```typescript
import { lazy, Suspense } from 'preact/compat';

const CreateSessionDialog = lazy(() => import('./CreateSessionDialog'));
const CreateScriptDialog = lazy(() => import('./CreateScriptDialog'));
const CreateTerminalCollectionDialog = lazy(() => import('./CreateTerminalCollectionDialog'));
const ConfigDialog = lazy(() => import('./ConfigDialog'));

export function PopupManager({ provider }: PopupManagerProps) {
  const createSessionDialog = useUIDialogStore(state => state.createSessionDialog);
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      {createSessionDialog.isOpen && (
        <CreateSessionDialog
          isOpen={createSessionDialog.isOpen}
          onClose={closeCreateSessionDialog}
          provider={provider}
          sessionData={createSessionDialog.sessionData}
          sessionDataError={createSessionDialog.sessionDataError}
        />
      )}
      {/* Other dialogs */}
    </Suspense>
  );
}
```

#### Conditional Rendering with Early Returns
```typescript
export function PopupManager({ provider }: PopupManagerProps) {
  const createSessionDialog = useUIDialogStore(state => state.createSessionDialog);
  
  // Early return if no dialogs are open
  if (!createSessionDialog.isOpen && 
      !createScriptDialog.isOpen && 
      !createTerminalCollectionDialog.isOpen && 
      !configDialog.isOpen) {
    return null;
  }
  
  // Render dialogs
}
```

## 6. MainTabs Optimization

### Current Issues
- Tab content re-renders when switching tabs
- Data initialization happens on every tab change
- Tab labels recalculate on every render

### Optimizations

#### Memoize Tab Content
```typescript
const tabContent = useMemo(() => ({
  sessions: (
    <SessionList
      sessions={sessions}
      isLoading={sessionsLoading}
      onEvent={handleEvent}
    />
  ),
  scripts: (
    <ScriptList
      scripts={scripts}
      isLoading={scriptsLoading}
      onEvent={handleEvent}
    />
  ),
  'terminal-collections': (
    <TerminalCollectionList
      terminalCollections={terminalCollections}
      isLoading={terminalCollectionsLoading}
      onEvent={handleEvent}
    />
  )
}), [sessions, scripts, terminalCollections, sessionsLoading, scriptsLoading, terminalCollectionsLoading, handleEvent]);
```

#### Optimize Tab Labels
```typescript
const tabItems = useMemo(() => [
  {
    id: 'sessions',
    label: `Sessions (${sessions.length})`,
    content: tabContent.sessions
  },
  {
    id: 'scripts',
    label: `Scripts (${scripts.length})`,
    content: tabContent.scripts
  },
  {
    id: 'terminal-collections',
    label: `Terminal Collections (${terminalCollections.length})`,
    content: tabContent['terminal-collections']
  }
], [sessions.length, scripts.length, terminalCollections.length, tabContent]);
```

## 7. SessionCard Optimization

### Current Issues
- Date formatting runs on every render
- Complex calculations in render function
- No memoization of computed values

### Optimizations

#### Memoize Expensive Calculations
```typescript
export function SessionCard({ session, isNewlyCreated = false }: SessionCardProps) {
  const formattedCreatedDate = useMemo(() => 
    formatDate(session.createdAt), [session.createdAt]
  );
  
  const formattedUpdatedDate = useMemo(() => 
    formatDate(session.updatedAt), [session.updatedAt]
  );
  
  const gitStatus = useMemo(() => 
    getGitStatus(session.git), [session.git]
  );
  
  const projectName = useMemo(() => 
    getProjectName(session.projectRoot), [session.projectRoot]
  );
  
  const activeFile = useMemo(() => 
    session.files.find(f => f.isActive)?.path.split('/').pop(), 
    [session.files]
  );
  
  // Component render
}
```

#### Optimize Date Formatting
```typescript
// Create a reusable date formatter
const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});

const formatDate = (date: Date | string | undefined) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    console.error('Invalid date:', date);
    return 'Invalid date';
  }
  
  return dateFormatter.format(dateObj);
};
```

## 8. Provider Pattern Optimization

### Current Issues
- Single large provider handles all data
- Provider re-initializes on every mount

### Optimizations

#### Split Providers by Domain
```typescript
// providers/SessionProvider.tsx
export function SessionProvider({ children }: { children: ReactNode }) {
  const { sessions, sessionsLoading, initializeSessions } = useSessionStore();
  
  useEffect(() => {
    if (!sessions.length && !sessionsLoading) {
      initializeSessions();
    }
  }, [sessions.length, sessionsLoading, initializeSessions]);
  
  return <SessionContext.Provider value={{ sessions, sessionsLoading }}>
    {children}
  </SessionContext.Provider>;
}

// providers/ScriptProvider.tsx
export function ScriptProvider({ children }: { children: ReactNode }) {
  const { scripts, scriptsLoading, initializeScripts } = useScriptStore();
  
  useEffect(() => {
    if (!scripts.length && !scriptsLoading) {
      initializeScripts();
    }
  }, [scripts.length, scriptsLoading, initializeScripts]);
  
  return <ScriptContext.Provider value={{ scripts, scriptsLoading }}>
    {children}
  </ScriptContext.Provider>;
}
```

#### Implement Provider Memoization
```typescript
const MemoizedSessionProvider = memo(SessionProvider);
const MemoizedScriptProvider = memo(ScriptProvider);
const MemoizedTerminalCollectionProvider = memo(TerminalCollectionProvider);

// In App.tsx
export function App({ provider }: AppProps) {
  return (
    <MemoizedSessionProvider>
      <MemoizedScriptProvider>
        <MemoizedTerminalCollectionProvider>
          <div className="app">
            <Header onConfigClick={handleConfigClick} />
            <div className="app-content">
              <MainTabs onEvent={handleEvent} />
              <PopupManager provider={provider} />
            </div>
          </div>
        </MemoizedTerminalCollectionProvider>
      </MemoizedScriptProvider>
    </MemoizedSessionProvider>
  );
}
```

## 9. CSS and DOM Optimization

### Current Issues
- No CSS-in-JS optimization
- Large CSS files loaded upfront

### Optimizations

#### Code Split CSS by Component
```typescript
// Use dynamic imports for CSS
const loadSessionStyles = () => import('./SessionList.css');
const loadScriptStyles = () => import('./ScriptList.css');

// Load styles when component mounts
useEffect(() => {
  loadSessionStyles();
}, []);
```

#### Use CSS Custom Properties for Theme Switching
```css
/* design-system.css */
:root {
  --primary-color: #007acc;
  --background-color: #1e1e1e;
  --text-color: #ffffff;
  --border-color: #3c3c3c;
}

[data-theme="light"] {
  --background-color: #ffffff;
  --text-color: #000000;
  --border-color: #e0e0e0;
}

[data-theme="dark"] {
  --background-color: #1e1e1e;
  --text-color: #ffffff;
  --border-color: #3c3c3c;
}

.session-card {
  background-color: var(--background-color);
  color: var(--text-color);
  border: 1px solid var(--border-color);
}
```

#### Implement Virtual Scrolling for Large Lists
```typescript
import { FixedSizeList as List } from 'react-window';

const VirtualizedSessionList = ({ sessions }: { sessions: SessionWithFullData[] }) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <SessionCard session={sessions[index]} />
    </div>
  );
  
  return (
    <List
      height={600}
      itemCount={sessions.length}
      itemSize={200}
      width="100%"
    >
      {Row}
    </List>
  );
};
```

## 10. Bundle Optimization

### Current Issues
- No code splitting visible
- All components loaded upfront

### Optimizations

#### Implement Route-based Code Splitting
```typescript
// Use dynamic imports for heavy components
const SessionList = lazy(() => import('./SessionList'));
const ScriptList = lazy(() => import('./ScriptList'));
const TerminalCollectionList = lazy(() => import('./TerminalCollectionList'));

// In MainTabs.tsx
const tabContent = useMemo(() => ({
  sessions: (
    <Suspense fallback={<div>Loading sessions...</div>}>
      <SessionList sessions={sessions} isLoading={sessionsLoading} onEvent={onEvent} />
    </Suspense>
  ),
  scripts: (
    <Suspense fallback={<div>Loading scripts...</div>}>
      <ScriptList scripts={scripts} isLoading={scriptsLoading} onEvent={onEvent} />
    </Suspense>
  ),
  'terminal-collections': (
    <Suspense fallback={<div>Loading terminal collections...</div>}>
      <TerminalCollectionList 
        terminalCollections={terminalCollections} 
        isLoading={terminalCollectionsLoading} 
        onEvent={onEvent} 
      />
    </Suspense>
  )
}), [sessions, scripts, terminalCollections, sessionsLoading, scriptsLoading, terminalCollectionsLoading, onEvent]);
```

#### Lazy Load Heavy Components
```typescript
// Dialogs
const CreateSessionDialog = lazy(() => import('./CreateSessionDialog'));
const CreateScriptDialog = lazy(() => import('./CreateScriptDialog'));
const CreateTerminalCollectionDialog = lazy(() => import('./CreateTerminalCollectionDialog'));
const ConfigDialog = lazy(() => import('./ConfigDialog'));

// Complex components
const Accordion = lazy(() => import('./Accordion'));
const AlertDialog = lazy(() => import('./AlertDialog'));
```

#### Tree Shake Unused Code
```typescript
// Use named imports instead of default imports
import { memo, useMemo, useCallback } from 'preact/hooks';
import { shallow } from 'zustand/shallow';

// Avoid importing entire libraries
import { FixedSizeList as List } from 'react-window';
// Instead of: import * as ReactWindow from 'react-window';
```

## 11. Implementation Priority

### Phase 1: High Impact, Low Effort (Week 1-2)
1. **Memoize components** - Add `memo()` to `SessionCard`, `SessionList`, `ScriptList`, etc.
2. **Memoize expensive calculations** - Use `useMemo()` for filtering, grouping, and formatting
3. **Optimize event handlers** - Use `useCallback()` for stable event handlers
4. **Add shallow equality selectors** - Use `shallow` from Zustand for object/array comparisons

### Phase 2: High Impact, Medium Effort (Week 3-4)
1. **Split Zustand store** - Break into domain-specific stores (`useSessionStore`, `useScriptStore`, etc.)
2. **Implement lazy loading** - Add `lazy()` and `Suspense` for dialogs and heavy components
3. **Optimize data loading** - Batch updates and reduce cascading effects
4. **Add virtual scrolling** - Implement for large lists

### Phase 3: Medium Impact, Low Effort (Week 5-6)
1. **Optimize CSS loading** - Code split CSS by component
2. **Improve provider pattern** - Split providers by domain
3. **Add pagination** - Implement for large datasets
4. **Optimize bundle size** - Tree shake unused code

### Phase 4: High Impact, High Effort (Week 7-8)
1. **Implement comprehensive virtualization** - For all list components
2. **Add comprehensive code splitting** - Route-based and component-based
3. **Implement advanced caching** - Consider React Query or SWR
4. **Performance monitoring** - Add performance metrics and monitoring

## Expected Performance Improvements

After implementing these optimizations, you should see:

- **50-70% reduction** in unnecessary re-renders
- **30-50% faster** initial load times
- **60-80% improvement** in large list scrolling performance
- **40-60% reduction** in memory usage
- **Better user experience** with smoother interactions and faster response times

## Monitoring and Measurement

To measure the effectiveness of these optimizations:

1. **Use React DevTools Profiler** to identify render bottlenecks
2. **Monitor bundle size** with webpack-bundle-analyzer
3. **Measure Core Web Vitals** (LCP, FID, CLS)
4. **Track render counts** with custom hooks
5. **Monitor memory usage** in production

## Conclusion

These optimizations will significantly improve the performance of the CodeState UI by reducing unnecessary renders, optimizing data loading, and implementing modern React performance patterns. Start with Phase 1 optimizations for immediate impact, then gradually implement the more complex optimizations in subsequent phases.