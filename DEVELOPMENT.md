# Development Setup Guide

This guide is for developers who want to contribute to CodeState IDE or set up the project for local development.

## 🛠️ Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **VS Code** - For development and testing
- **Git** - For version control

## 🎯 Overview

CodeState IDE depends on two other repositories:
- **code-state-library**: Core functionality and CLI tools
- **codestate-ui**: UI components and webview interface

This setup ensures that when you clone `code-state-ide-v2`, you automatically get all required dependencies and can develop with local repositories.

## 🚀 Quick Setup

### Automatic Setup (Recommended)
The development environment is automatically set up when you install dependencies:

```bash
# Clone the main repository
git clone https://github.com/codestate-cs/code-state-ide.git
cd code-state-ide

# Install dependencies (automatically runs setup)
npm install
```

That's it! The `postinstall` script will automatically:
- ✅ Clone `code-state-library` and `codestate-ui` repositories at the same level
- ✅ Install dependencies for all projects
- ✅ Build the core library and UI components
- ✅ Set up local package links
- ✅ Build the main extension

### Manual Setup (Alternative)
If you prefer to set up manually or the automated script doesn't work:

#### 1. Clone All Repositories
```bash
# Clone the main repository
git clone https://github.com/codestate-cs/code-state-ide.git
cd code-state-ide

# Clone dependencies (run from parent directory)
cd ..
git clone https://github.com/codestate-cs/code-state-library.git
git clone https://github.com/codestate-cs/codestate-ui.git
cd code-state-ide
```

#### 2. Build Dependencies
```bash
# Build code-state-library
cd ../code-state-library
npm install
npm run build:core
cd ../code-state-ide

# Build codestate-ui
cd ../codestate-ui
npm install
npm run build
cd ../code-state-ide
```

#### 3. Install Main Project Dependencies
```bash
npm install
```

#### 4. Build the Extension
```bash
npm run compile
```

## 📁 Repository Structure

After setup, your directory structure will look like this:

```
parent-directory/
├── code-state-ide-v2/     # Main VS Code extension
├── code-state-library/    # Core library and CLI
└── codestate-ui/          # UI components
```

## 🔧 Configuration Modes

The project supports two configuration modes:

### Development Mode (Default)
- **Dependencies**: Local file references (`file:../code-state-library/packages/core`)
- **Benefits**: Real-time development, instant changes, debugging
- **Use Case**: Active development and testing

### Production Mode
- **Dependencies**: Published npm packages (`@codestate/core: ^1.0.9`)
- **Benefits**: Stable, tested packages, marketplace-ready
- **Use Case**: Building final VSIX packages

### Switching Between Modes

```bash
# Switch to development mode
./switch-config.sh dev
npm install

# Switch to production mode  
./switch-config.sh prod
npm install
```

## 🛠️ Available Scripts

### Setup Scripts
- `./setup-dev.sh` - Complete automated setup
- `./switch-config.sh [dev|prod]` - Switch configuration modes

### Development Scripts
- `npm run dev` - Setup + watch mode (one command)
- `npm run watch` - Start development mode
- `npm run compile` - Build the extension
- `npm run test` - Run tests

### Production Scripts
- `npm run package` - Build production VSIX
- `npm run vscode:prepublish` - Prepare for publishing

## 🔍 How It Works

### Automated Setup Process
1. **Clone Dependencies**: Automatically clones `code-state-library` and `codestate-ui`
2. **Install Dependencies**: Runs `npm install` in each repository
3. **Build Libraries**: Builds core library and UI components
4. **Link Packages**: Creates symlinks for local development
5. **Build Extension**: Compiles the main VS Code extension

### Local Package Linking
The setup creates symlinks in `node_modules/@codestate/` that point to your local repositories:
- `node_modules/@codestate/core` → `../code-state-library/packages/core`
- `node_modules/@codestate/ui` → `../codestate-ui`

### Configuration Files
- `package.json` - Current configuration (switched by scripts)
- `package.dev.json` - Development configuration template
- `package.prod.json` - Production configuration template

## 🔄 Development Workflow

### Starting Development
1. Run `./setup-dev.sh` (first time only)
2. Run `npm run watch`
3. Press F5 in VS Code to test

### Making Changes
1. **Core Library Changes**: Edit files in `../code-state-library/packages/core`
2. **UI Changes**: Edit files in `../codestate-ui`
3. **Extension Changes**: Edit files in current directory
4. Changes are automatically reflected (with watch mode)

### Testing Changes
1. **Unit Tests**: `npm test`
2. **Extension Testing**: Press F5 in VS Code
3. **Integration Testing**: Test in Extension Development Host

### Building for Production
1. Switch to production mode: `./switch-config.sh prod`
2. Install dependencies: `npm install`
3. Build package: `npm run package`


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

### Setup Script Issues
```bash
# Make sure scripts are executable
chmod +x setup-dev.sh switch-config.sh

# Run with verbose output
bash -x setup-dev.sh
```

### Dependency Issues
```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install

# Rebuild dependencies
cd ../code-state-library && npm run build:core
cd ../codestate-ui && npm run build
cd ../code-state-ide-v2
```

### Symlink Issues
```bash
# Remove and recreate symlinks
rm -rf node_modules/@codestate
npm install
```

### Build Issues
```bash
# Clean and rebuild
rm -rf dist/ resources/ui/
npm run compile

# Clean build artifacts
rm -rf dist/ out/
npm run compile
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