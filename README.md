# CodeState IDE

[![Version](https://img.shields.io/badge/version-1.2.1-blue.svg)](https://github.com/codestate-cs/code-state-ide)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![VS Code Marketplace](https://img.shields.io/badge/VS%20Code-Marketplace-blue.svg)](https://marketplace.visualstudio.com/items?itemName=karthikchinasani.codestate-ide)

**Save and restore your complete development environment** - never lose your coding context again! CodeState IDE automatically captures and restores your open files, terminal commands, scripts, and project state across sessions.

## 🎬 Demo

![CodeState IDE Demo](https://raw.githubusercontent.com/codestate-cs/code-state-ide/refs/heads/main/assets/Codestate.gif)

*See CodeState IDE in action - saving and restoring your complete development environment*

## ✨ What CodeState Does

### 💾 Complete Session Management
- **Save Your Work**: Capture your entire development session with one click
- **Instant Resume**: Restore all open files, cursor positions, and scroll states
- **Never Lose Context**: Pick up exactly where you left off, even after restarting VS Code

### 🖥️ Terminal Command History
- **Save Terminal Sessions**: Automatically run commands that are needed when you open the vscode
- **Replay Commands**: Execute saved command sequences with a single click
- **Organize Scripts**: Create and manage development scripts for common tasks
- **🎯 IDE Execution Mode**: Choose to run commands directly in VS Code's built-in terminal for seamless integration

### 📁 Smart File Management
- **Remember Everything**: Open files, tabs, and editor states are preserved
- **Cursor Positions**: Exact cursor locations and scroll positions are saved
- **Project Context**: Maintain awareness of your current working directory and git state

### 🌿 Git Integration
- **Track Git State**: Monitor branches, commits, and stashes
- **Context Awareness**: Understand your project's git status at session save/restore
- **Branch Management**: Seamlessly switch between different development contexts

## 🚀 Getting Started

### Installation
1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X` or `Cmd+Shift+X`)
3. Search for "CodeState IDE"
4. Click Install

### Quick Start
1. **Open CodeState**: Click the CodeState icon in the Activity Bar or use `Ctrl+Shift+P` → "Open CodeState"
2. **Start Coding**: Begin your development work as usual
3. **Save Session**: Use CodeState to save your current environment
4. **Resume Later**: Restore your complete development context anytime

## 🎯 How to Use

### Saving Your Session
- Click the CodeState icon in the Activity Bar
- Use the "Save Session" option to capture your current state
- Give your session a meaningful name for easy identification

### Restoring Sessions
- View all your saved sessions in the CodeState panel
- Click on any session to instantly restore your complete environment
- All files, terminals, and project state will be exactly as you left them

### Managing Sessions
- **Organize**: Group sessions by project or feature
- **Delete**: Remove sessions you no longer need
- **Rename**: Update session names for better organization

### 🎯 IDE Execution Mode
- **Native Integration**: Terminal collections run directly in VS Code's built-in terminal
- **Tab Management**: Each script opens in its own named terminal tab for easy organization
- **Seamless Experience**: No need to switch between external terminals and VS Code
- **Auto-Resume**: Terminal collections with IDE execution mode automatically resume in VS Code terminals
- **Flexible Options**: Choose between IDE-integrated terminals or external terminal execution based on your preference

## 🎨 Features

- **🎨 Beautiful Interface**: Modern, intuitive design that integrates seamlessly with VS Code
- **📱 Activity Bar Integration**: Quick access from the sidebar
- **⚡ Fast Performance**: Optimized for speed with minimal impact on VS Code
- **🔒 Reliable**: Robust session management that won't lose your work
- **🌐 Cross-Platform**: Works on Windows, macOS, and Linux

## 💡 Use Cases

### Daily Development
- **Morning Setup**: Quickly restore yesterday's work environment
- **Context Switching**: Move between different projects without losing progress
- **Break Recovery**: Resume exactly where you left off after lunch or meetings

### Project Management
- **Feature Branches**: Save different development contexts for different features
- **Bug Investigation**: Capture the exact state when investigating issues
- **Code Reviews**: Share complete development environments with team members

### Learning & Experimentation
- **Tutorial Following**: Save progress while learning new technologies
- **Experiment Tracking**: Capture different approaches and compare results
- **Workshop Preparation**: Set up complete environments for coding workshops

## 🛠️ Supported IDEs

CodeState works with any VS Code-compatible IDE:
- **Visual Studio Code** (primary)
- **Cursor** (AI-powered VS Code fork)
- **Codeium** (AI-powered VS Code fork)
- **GitHub Codespaces** (browser-based VS Code)
- **Any VS Code-based editor** that supports extensions

## 📊 What's New in Latest Version

- **🎯 IDE Execution Mode**: Choose to run terminal commands directly in VS Code's built-in terminal instead of external terminals
- **🖥️ Native Terminal Integration**: Terminal collections now open as native VS Code terminal tabs with proper naming and organization
- **⚡ Enhanced Terminal Management**: Seamless integration between CodeState and VS Code's terminal system
- **✅ Unified Data Loading**: OS information now included in configuration response for faster initialization
- **✅ Enhanced Reliability**: Fixed message handling inconsistencies that prevented some responses from reaching the UI
- **✅ Better Debugging**: Comprehensive logging system for easier troubleshooting and development
- **✅ Improved Architecture**: Simplified handler system with consistent response patterns
- **✅ Development Tools**: Added local UI development workflow support

---

**Never lose your coding context again!** 

CodeState IDE makes development more efficient by eliminating the time spent recreating your perfect development environment. Focus on coding, not setup.

## 👨‍💻 For Developers

Want to contribute or set up the project locally? 

### 🚀 Quick Development Setup
```bash
git clone https://github.com/codestate-cs/code-state-ide.git
cd code-state-ide
npm install
```

This automatically clones the other repositories and sets up everything you need!

### 📚 Development Guides
- **[Development Guide](DEVELOPMENT.md)** - Complete setup and development instructions

---

[⭐ Star us on GitHub](https://github.com/codestate-cs/code-state-ide) | [🐛 Report Issues](https://github.com/codestate-cs/code-state-ide/issues) | [📖 Development Guide](DEVELOPMENT.md)