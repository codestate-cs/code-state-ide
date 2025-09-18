# Development Setup Guide

This guide is for developers who want to contribute to CodeState IDE or set up the project for local development.

## 🛠️ Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **VS Code** - For development and testing
- **Git** - For version control

## 🚀 Quick Setup

### 1. Clone the Repository
```bash
git clone https://github.com/codestate-cs/code-state-ide.git
cd code-state-ide
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Build the Extension
```bash
npm run compile
```

### 4. Run in Development Mode
```bash
npm run watch
```

### 5. Test the Extension
1. Open VS Code
2. Press `F5` or go to Run → Start Debugging
3. This opens a new Extension Development Host window
4. Test the extension in the new window

## 📁 Project Structure

```
├── src/                    # Extension source code
│   ├── extension.ts        # Main extension entry point
│   ├── webview/            # WebView providers
│   │   ├── WebviewProvider.ts      # Main webview panel
│   │   └── HelpWebviewProvider.ts  # Activity bar webview
│   ├── handlers/           # Message handlers
│   │   ├── BaseHandler.ts          # Base handler interface
│   │   ├── MessageHandler.ts       # Main message router
│   │   ├── SessionHandler.ts      # Session management
│   │   ├── ScriptHandler.ts        # Script execution
│   │   ├── TerminalCollectionHandler.ts # Terminal management
│   │   ├── ConfigHandler.ts        # Configuration
│   │   └── UIHandler.ts            # UI interactions
│   ├── services/           # Background services
│   │   ├── CodeStateService.ts     # Core state management
│   │   ├── SessionService.ts       # Session operations
│   │   ├── FileSystemService.ts    # File operations
│   │   ├── GitValidationService.ts # Git operations
│   │   ├── ScriptService.ts        # Script management
│   │   ├── TerminalCollectionService.ts # Terminal collections
│   │   ├── SessionDataCollector.ts # Data collection
│   │   └── AutoResumeService.ts    # Auto-resume functionality
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/              # Utility functions
│   │   ├── logger.ts       # Logging utility
│   │   └── error.ts         # Error handling
│   └── test/               # Test files
├── dist/                   # Compiled extension output
│   └── extension.js        # Bundled extension code
├── resources/              # Static resources
│   ├── icon.svg            # Extension icon
│   └── ui/                 # Bundled UI library files
│       ├── codesate-ui.css
│       └── codesate-ui.iife.js
├── docs/                   # Documentation
├── tests/                  # Integration tests
├── esbuild.js              # Build configuration
├── package.json            # Extension manifest
├── tsconfig.json           # TypeScript configuration
├── eslint.config.mjs       # ESLint configuration
└── .vscodeignore           # Files to exclude from package
```

## 🔧 Build System

### esbuild Configuration
The project uses **esbuild** for fast bundling and includes:

- **Automatic UI Bundling**: UI library files are copied to `resources/ui/`
- **Tree Shaking**: Unused code elimination for smaller bundle size
- **Source Maps**: Available in development mode for debugging
- **Production Optimization**: Minification and console removal in production

### Available Scripts

```bash
# Development
npm run compile          # Build development version with UI bundling
npm run watch            # Build and watch for changes
npm run check-types      # TypeScript type checking
npm run lint             # ESLint code linting

# Production
npm run package          # Build production package with UI bundling

# Testing
npm run test             # Run tests
npm run compile-tests    # Compile test files
npm run watch-tests      # Watch and compile tests
```

### UI Library Bundling

The extension uses `@codestate/ui` library which is automatically bundled:

1. **Source**: Files are copied from `node_modules/@codestate/ui/dist/`
2. **Destination**: Files are placed in `resources/ui/`
3. **Files**: 
   - `codesate-ui.css` - UI styles
   - `codesate-ui.iife.js` - UI JavaScript library
4. **Webview Loading**: Files are loaded via webview URIs in the browser context

## 🏗️ Architecture

### Extension Entry Point
- **`src/extension.ts`**: Main activation function and command registration

### WebView System
- **`WebviewProvider`**: Creates and manages the main webview panel
- **`HelpWebviewProvider`**: Manages the activity bar webview
- **Message Handling**: Bidirectional communication between webview and extension

### Service Layer
- **`CodeStateService`**: Core state management and persistence
- **`SessionService`**: Session creation, saving, and restoration
- **`FileSystemService`**: File operations and workspace management
- **`GitValidationService`**: Git state tracking and validation

### Handler System
- **`MessageHandler`**: Routes messages to appropriate handlers
- **Handler Pattern**: Each feature has its own handler class
- **Type Safety**: All messages are strongly typed

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run specific test suites
npm run test -- --grep "SessionHandler"
npm run test -- --grep "WebviewProvider"
```

### Test Structure
```
src/test/
├── extension.test.ts      # Main extension tests
├── handlers/              # Handler tests
├── services/              # Service tests
├── utils/                 # Utility tests
└── webview/               # Webview tests
```

### Debugging Tests
1. Set breakpoints in test files
2. Run tests in VS Code debugger
3. Use `console.log` for debugging (removed in production builds)

## 🐛 Debugging

### Extension Development
1. **Set Breakpoints**: In VS Code, set breakpoints in TypeScript files
2. **Start Debugging**: Press `F5` or Run → Start Debugging
3. **Extension Development Host**: New VS Code window opens for testing
4. **Debug Console**: View logs and debug output

### WebView Debugging
1. **Open Developer Tools**: Right-click in webview → Inspect Element
2. **Console Logs**: View webview console output
3. **Network Tab**: Debug resource loading issues
4. **Sources Tab**: Debug JavaScript in webview context

### Common Issues

#### HTMLElement Error
- **Cause**: UI library imported in Node.js context
- **Solution**: UI library loaded only in webview browser context

#### Resource Loading Errors
- **Cause**: Incorrect file paths or missing bundled files
- **Solution**: Check `resources/ui/` directory and webview URI generation

#### Extension Activation Issues
- **Cause**: Missing dependencies or compilation errors
- **Solution**: Run `npm run compile` and check for TypeScript errors

## 📦 Packaging

### Creating a VSIX Package
```bash
npm run package
```

This creates a `.vsix` file that can be:
- Installed locally: `code --install-extension codestate-ide-1.2.0.vsix`
- Published to marketplace
- Shared with others

### Package Contents
- **`dist/extension.js`**: Bundled extension code
- **`resources/ui/`**: UI library files
- **`resources/icon.svg`**: Extension icon
- **`package.json`**: Extension manifest

## 🤝 Contributing

### Development Workflow
1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Make** your changes
4. **Test** thoroughly: `npm test`
5. **Lint** your code: `npm run lint`
6. **Commit** your changes: `git commit -m 'Add amazing feature'`
7. **Push** to your branch: `git push origin feature/amazing-feature`
8. **Open** a Pull Request

### Code Style
- **TypeScript**: Strict mode enabled
- **ESLint**: Follow configured rules
- **Naming**: Use descriptive names for functions and variables
- **Comments**: Document complex logic and public APIs

### Pull Request Guidelines
- **Tests**: Include tests for new features
- **Documentation**: Update relevant documentation
- **Breaking Changes**: Clearly document any breaking changes
- **Performance**: Consider impact on extension startup time

## 🔍 Troubleshooting

### Build Issues
```bash
# Clean and rebuild
rm -rf dist/ resources/ui/
npm run compile
```

### Dependency Issues
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors
```bash
# Check types without emitting
npm run check-types
```

### Extension Not Loading
1. Check VS Code Developer Console for errors
2. Verify extension is properly compiled
3. Check `package.json` activation events
4. Ensure all dependencies are installed

## 📚 Additional Resources

- **VS Code Extension API**: [Official Documentation](https://code.visualstudio.com/api)
- **TypeScript**: [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- **esbuild**: [esbuild Documentation](https://esbuild.github.io/)
- **WebView API**: [VS Code WebView Guide](https://code.visualstudio.com/api/extension-guides/webview)

## 🆘 Getting Help

- **Issues**: [GitHub Issues](https://github.com/codestate-cs/code-state-ide/issues)
- **Discussions**: [GitHub Discussions](https://github.com/codestate-cs/code-state-ide/discussions)
- **Documentation**: [Project Wiki](https://github.com/codestate-cs/code-state-ide/wiki)

---

**Happy coding!** 🚀