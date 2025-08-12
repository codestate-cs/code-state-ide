# CodeState VS Code Extension UI Design

## Overview

This document outlines the user interface design for the CodeState VS Code extension, focusing on the activity bar structure, session management, and configuration interface. The design follows VS Code's native patterns while providing intuitive session and command management.

## Activity Bar Structure

The CodeState extension provides two main accordions in the VS Code activity bar sidebar:

### 1. Sessions & Commands Accordion
Primary interface for managing development sessions and project commands.

### 2. Config Accordion
Configuration and settings management for the extension.

## Sessions & Commands Accordion

### Tree Structure
```
📄 Sessions & Commands
├── /Users/dev/project-a (3 sessions, 2 commands)
│   ├── 🖥️ Commands (2)
│   │   ├── npm run dev (active)
│   │   └── npm test
│   └── 📄 Sessions (3)
│       ├── 🚀 Feature: User Authentication (2 hours ago)
│       ├── 🐛 Bug Fix: Login Validation (1 day ago)
│       └── 📝 Refactor: API Layer (3 days ago)
├── /Users/dev/project-b (1 session, 1 command)
│   ├── 🖥️ Commands (1)
│   │   └── npm run storybook
│   └── 📄 Sessions (1)
│       └── 🎨 UI: Dashboard Redesign (4 hours ago)
└── /Users/dev/project-c (0 sessions, 0 commands)
    ├── 🖥️ Commands (0)
    │   └── No commands saved
    └── 📄 Sessions (0)
        └── No sessions saved
```

### Data Architecture

#### Project Root Level
- **Commands**: Terminal commands stored at the project level, shared across all sessions
- **Sessions**: Individual development sessions with file states, git state, and metadata

#### Session Resume Flow
When resuming a session:
1. Restore files from the selected session
2. Restore commands from the project root (not from the session)
3. Switch git branch if different from current
4. Apply window state from the session

### Expanded Session View

When a session is clicked, it expands to show detailed information:

```
🚀 Feature: User Authentication (2 hours ago) [EXPANDED]
├── 📄 Files (5)
│   ├── src/auth/Login.tsx (active, line 45)
│   ├── src/auth/Register.tsx (line 23)
│   ├── src/components/Button.tsx (line 12)
│   ├── src/utils/auth.ts (line 67)
│   └── tests/auth.test.ts (line 89)
├── 🌿 Branch: feature/auth
├── 🏷️ Tags: feature, auth, frontend
└── 📝 Notes: Implementing OAuth2 flow with Google and GitHub providers
```

### Visual Design Elements

#### Icons and Visual Hierarchy
- **🌐 Root**: CodeState Sessions
- **📁 Project Folders**: Grouped by rootPath, with session and command counts
- **🖥️ Commands**: Terminal commands at project level
- **📄 Sessions**: Individual development sessions
- **📄 Files**: Open files within expanded sessions
- **🌿 Git State**: Branch and commit information
- **🏷️ Tags**: Categorized tags with color coding
- **📝 Notes**: Session description

#### Session Type Icons
- **🚀 Feature**: New feature development
- **🐛 Bug Fix**: Bug fixes and patches
- **📝 Refactor**: Code refactoring
- **🔧 Setup**: Project setup and configuration
- **🎨 UI/Design**: UI and design work
- **📚 Documentation**: Documentation updates
- **🧪 Testing**: Test development and debugging

#### Status Indicators
- **🟢 Active**: Currently resumed session
- **🟡 Modified**: Session has been updated since last save
- **🔴 Error**: Session restoration failed
- **⚪ Default**: Normal session state

### Interactive Elements

#### Click Actions
- **Click on Session**: Expand/collapse session details
- **Click on Project**: Expand/collapse project (commands + sessions)
- **Click on Commands**: Expand/collapse commands list

#### Context Menu Actions

**For Sessions:**
- **▶️ Resume Session** (primary action)
- **✏️ Rename Session**
- **📝 Edit Notes**
- **🏷️ Manage Tags**
- **📤 Export Session**
- **🗑️ Delete Session**
- **📋 Copy Session ID**

**For Commands:**
- **🖥️ Execute Command**
- **📋 Copy Command**
- **✏️ Edit Command**
- **🗑️ Remove Command**
- **➕ Add New Command**

**For Files (when session expanded):**
- **📄 Open File**
- **📋 Copy File Path**
- **🗑️ Remove from Session**

**For Project Folders:**
- **💾 Save Current Session**
- **🔄 Resume Last Session**
- **📋 List All Sessions**
- **🗑️ Delete All Sessions** (with confirmation)

### Session Resume Flow

#### Resume Process
1. **User clicks session** → Context menu → "Resume Session"
2. **Confirmation dialog**: "Resume 'Feature: User Authentication'? This will close current files and restore project commands."
3. **Progress indicators**:
   ```
   🔄 Resuming session...
   ├── 📄 Opening files from session... (3/5)
   ├── 🖥️ Starting project commands... (1/2)
   ├── 🌿 Switching to branch: feature/auth
   └── ✅ Session resumed successfully
   ```
4. **Completion**: Files open from session, project commands start, branch switches

## Config Accordion

### Tree Structure
```
⚙️ Config
├── 🎯 General Settings
│   ├── Auto-save sessions on workspace change
│   ├── Auto-resume last session on startup
│   └── Show session count in status bar
├── 📁 Storage Settings
│   ├── Session storage location
│   ├── Auto-cleanup old sessions (30 days)
│   └── Export format preference
├── 🖥️ Terminal Settings
│   ├── Auto-start commands on session resume
│   ├── Terminal shell preference
│   └── Command timeout (30 seconds)
├── 🌿 Git Settings
│   ├── Auto-stash changes on session save
│   ├── Restore git state on session resume
│   └── Include git status in session metadata
└── 🔧 Advanced Settings
    ├── Debug mode
    ├── Log level (Info)
    └── Reset all settings
```

### Settings Categories

#### General Settings
```
🎯 General Settings
├── ☑️ Auto-save sessions on workspace change
├── ☐ Auto-resume last session on startup
├── ☑️ Show session count in status bar
├── ☐ Show session notifications
└── ☑️ Enable session search
```

#### Storage Settings
```
📁 Storage Settings
├── Session storage location: ~/.codestate/sessions
├── ☑️ Auto-cleanup old sessions (30 days)
├── ☐ Compress session data
├── Export format preference: JSON
└── ☑️ Backup sessions before cleanup
```

#### Terminal Settings
```
🖥️ Terminal Settings
├── ☑️ Auto-start commands on session resume
├── Terminal shell preference: Default
├── Command timeout: 30 seconds
├── ☐ Wait for commands to complete
└── ☑️ Show command output in notifications
```

#### Git Settings
```
🌿 Git Settings
├── ☑️ Auto-stash changes on session save
├── ☑️ Restore git state on session resume
├── ☐ Include git status in session metadata
├── ☑️ Switch branches automatically
└── ☐ Commit before session save
```

#### Advanced Settings
```
🔧 Advanced Settings
├── ☐ Debug mode
├── Log level: Info
├── ☐ Enable telemetry
├── ☑️ Check for updates
└── Reset all settings
```

### Settings Interaction

#### Setting Types
- **☑️ Boolean**: Auto-save sessions on workspace change
- **📁 Path**: Session storage location: ~/.codestate/sessions
- **🔢 Number**: Command timeout: 30 seconds
- **📋 Dropdown**: Log level: Info
- **📝 Text**: Custom command prefix: codestate

#### Interactive Elements
- **Checkbox items**: Click to toggle on/off
- **Dropdown items**: Click to show options
- **Text inputs**: Click to edit value
- **File paths**: Click to browse

#### Context Menu Actions
**For Config Items:**
- **✏️ Edit Setting**
- **📋 Copy Value**
- **🔄 Reset to Default**
- **📖 View Documentation**

## Search and Filter System

### Sessions & Commands Search
```
🔍 Search sessions, files, or commands... (Ctrl+F)
```

**Search Options:**
- **Session name**: Fuzzy matching
- **File names**: Search within open files
- **Command text**: Search within project commands
- **Tags**: Filter by tags
- **Notes**: Search within notes
- **Git branch**: Filter by branch name

### Config Search
```
🔍 Search settings... (Ctrl+F)
```

### Filter Panel
```
Filters:
☑️ Show All Sessions
☐ Show Features Only
☐ Show Bug Fixes Only
☐ Show Refactors Only
☐ Show Setup Only
☐ Show UI/Design Only
☐ Show Documentation Only
☐ Show Testing Only

File Types: [.tsx] [.ts] [.js] [.css] [.json]
Command Types: [npm] [yarn] [git] [custom]
```

## Empty States

### No Projects
```
📄 Sessions & Commands
└── 📭 No projects found
    ├── 💾 Open a workspace to get started
    └── 📚 Learn more about CodeState
```

### No Commands in Project
```
📁 /Users/dev/new-project
├── 🖥️ Commands (0)
│   └── No commands saved
│       └── ➕ Add your first command
└── 📄 Sessions (1)
    └── 🚀 Feature: Initial Setup (1 hour ago)
```

### No Sessions in Project
```
📁 /Users/dev/new-project
├── 🖥️ Commands (1)
│   └── npm run dev
└── 📄 Sessions (0)
    └── No sessions saved
        └── 💾 Save your first session to get started
```

### No Settings
```
⚙️ Config
└── 📭 No settings available
    └── 🔧 Settings will appear here
```

## Status Indicators

### Activity Bar Icon
- **🟢 Normal**: CodeState is active
- **🟡 Modified**: Unsaved changes or active session
- **🔴 Error**: Extension error or session failure
- **⚪ Default**: Extension is inactive

### Settings Status
- **🔵 Default**: Setting is at default value
- **🟡 Modified**: Setting has been changed
- **🔴 Error**: Setting has an invalid value
- **⚪ Unknown**: Setting status unknown

## Keyboard Navigation

### Sessions & Commands
- **Arrow Up/Down**: Navigate between items
- **Arrow Left/Right**: Expand/collapse items
- **Enter**: Resume session or execute command
- **Space**: Expand/collapse session details
- **Ctrl/Cmd + Enter**: Save current session
- **Delete**: Delete selected session
- **F2**: Rename session

### Config
- **Arrow Up/Down**: Navigate between settings
- **Enter**: Edit setting value
- **Space**: Toggle boolean settings
- **Tab**: Move between setting fields

## Performance Considerations

### Lazy Loading
- **Session details**: Load only when session is expanded
- **File details**: Load only when session is expanded
- **Command details**: Load only when commands are expanded
- **Git state**: Load on demand

### Caching
- **Recent sessions**: Cache for quick access
- **File states**: Cache for faster restoration
- **Command history**: Cache for command suggestions

### Virtual Scrolling
- **Large session lists**: Implement virtual scrolling for performance
- **File lists**: Virtual scrolling for sessions with many files

## Animation and Transitions

### Smooth Interactions
- **Expand/Collapse**: Smooth height transitions (200ms ease-in-out)
- **Hover Effects**: Subtle background color changes
- **Selection**: Clear visual feedback with border highlighting
- **Loading**: Spinning indicators for async operations
- **Success/Error**: Brief toast notifications

### Performance Optimizations
- **Debounced Search**: Prevent excessive API calls during typing
- **Throttled Updates**: Limit UI updates during rapid changes
- **Background Refresh**: Update session list periodically without blocking UI

## Accessibility

### Screen Reader Support
- **ARIA Labels**: Proper labeling for all interactive elements
- **Keyboard Navigation**: Full keyboard accessibility
- **Focus Management**: Clear focus indicators and logical tab order
- **Descriptive Text**: Meaningful descriptions for all actions

### Visual Accessibility
- **High Contrast**: Support for high contrast themes
- **Color Independence**: Information not conveyed by color alone
- **Font Scaling**: Support for different font sizes
- **Reduced Motion**: Respect user's motion preferences

## Responsive Design

### Compact Mode (Narrow Sidebar)
```
🌐 CodeState
├── 📁 project-a (3)
├── 📁 project-b (1)
└── 📁 project-c (0)
```

### Detailed Mode (Wide Sidebar)
```
📄 Sessions & Commands
├── 📁 /Users/dev/project-a (3 sessions, 2 commands)
│   ├── 🖥️ Commands (2)
│   │   ├── npm run dev (active)
│   │   └── npm test
│   └── 📄 Sessions (3)
│       ├── 🚀 Feature: User Authentication (2 hours ago)
│       ├── 🐛 Bug Fix: Login Validation (1 day ago)
│       └── 📝 Refactor: API Layer (3 days ago)
└── 📁 /Users/dev/project-b (1 session, 1 command)
```

## Design Principles

### 1. Native VS Code Integration
- Follow VS Code's design patterns and conventions
- Use native VS Code components where possible
- Maintain consistency with VS Code's visual language

### 2. Progressive Disclosure
- Show essential information by default
- Expand details on demand
- Reduce cognitive load with clear hierarchy

### 3. Contextual Actions
- Provide relevant actions based on selection
- Use context menus for secondary actions
- Keep primary actions easily accessible

### 4. Performance First
- Optimize for large numbers of sessions
- Implement lazy loading and caching
- Provide immediate feedback for user actions

### 5. Error Handling
- Graceful degradation when operations fail
- Clear error messages with actionable guidance
- Maintain UI state during error conditions

## Future Enhancements

### Planned Features
- **Session Templates**: Pre-defined session configurations
- **Session Sharing**: Export/import sessions between team members
- **Session Analytics**: Usage statistics and insights
- **Custom Themes**: User-defined visual themes
- **Plugin System**: Extensible functionality through plugins

### Advanced Interactions
- **Drag and Drop**: Reorder sessions and commands
- **Multi-selection**: Bulk operations on multiple sessions
- **Keyboard Shortcuts**: Customizable keyboard shortcuts
- **Voice Commands**: Voice control for basic operations

This UI design provides a comprehensive, intuitive interface that scales well from simple use cases to complex session management while maintaining the familiar VS Code experience.
