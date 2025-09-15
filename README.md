# CodeState IDE

[![Version](https://img.shields.io/badge/version-0.0.1-blue.svg)](https://github.com/codestate-cs/codestate-ui)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![VS Code Marketplace](https://img.shields.io/badge/VS%20Code-Marketplace-blue.svg)](https://marketplace.visualstudio.com/items?itemName=karthikchinasani.codestate-ide)

Development session management extension for Visual Studio Code and compatible IDEs (like Cursor, Codeium, etc.) that saves and restores your complete coding environment, including open files, terminal commands, scripts, and project state.

## ✨ Features

- **💾 Session Management**: Save and restore complete development sessions with all your work
- **📁 File State Preservation**: Remember open files, cursor positions, and scroll states
- **🖥️ Terminal Command History**: Save and replay terminal commands and collections
- **📜 Script Management**: Create, organize, and execute development scripts
- **🌿 Git Integration**: Track git state, branches, commits, and stashes
- **⚡ Fast Resume**: Quickly restore your entire development environment
- **🎨 Beautiful UI**: Modern, intuitive interface that integrates seamlessly with VS Code
- **📱 Activity Bar Integration**: Quick access to CodeState features from the sidebar

## 🚀 Installation

### Supported IDEs

CodeState works with any VS Code-compatible IDE, including:
- **Visual Studio Code** (primary)
- **Cursor** (AI-powered VS Code fork)
- **Codeium** (AI-powered VS Code fork)
- **GitHub Codespaces** (browser-based VS Code)
- **Any VS Code-based editor** that supports extensions

### From VS Code Marketplace (Recommended)

1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X` or `Cmd+Shift+X`)
3. Search for "CodeState IDE"
4. Click Install

### From Source

1. Clone the repository:
   ```bash
   git clone https://github.com/codestate-cs/codestate-ui.git
   cd codestate-ui
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run package
   ```

4. Install the `.vsix` file:
   ```bash
   code --install-extension codestate-ide-0.0.1.vsix
   ```

## 🎯 Usage

### Quick Start

1. **Open CodeState IDE**: Click the CodeState icon in the Activity Bar or use `Ctrl+Shift+P` and search for "Open CodeState"
2. **Configure Settings**: Click the settings button to configure your IDE preferences
3. **Start Coding**: Begin coding and experience AI-powered assistance

### Commands

- `CodeState: Open CodeState IDE` - Opens the main CodeState interface
- Available in Command Palette (`Ctrl+Shift+P`)

### Activity Bar

The CodeState icon in the Activity Bar provides:
- Quick access to open the IDE
- Help and documentation links
- Issue reporting and contribution links

## ⚙️ Configuration

Configure CodeState through the settings panel:

- **IDE Selection**: Choose between VS Code and Cursor
- **AI Model Settings**: Configure AI assistance preferences
- **Analytics**: Enable/disable code analytics collection

## 🛠️ Development

### Prerequisites

- Node.js 18+ 
- npm or yarn
- VS Code

### Setup

1. Clone and install dependencies:
   ```bash
   git clone https://github.com/codestate-cs/codestate-ui.git
   cd codestate-ui
   npm install
   ```

2. Build the extension:
   ```bash
   npm run package
   ```

3. Run in development mode:
   ```bash
   npm run watch
   ```

### Project Structure

```
├── src/                    # Extension source code
│   ├── extension.ts        # Main extension entry point
│   ├── webview/            # WebView providers
│   ├── handlers/           # Message handlers
│   ├── services/           # Background services
│   └── utils/              # Utility functions
├── resources/              # Static resources (icons, etc.)
├── docs/                   # Documentation
└── package.json            # Extension manifest
```

### Scripts

- `npm run package` - Build production package
- `npm run watch` - Build and watch for changes
- `npm run check-types` - TypeScript type checking
- `npm run lint` - ESLint code linting

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all checks pass before submitting PR

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Bug Reports & Feature Requests

- **Bug Reports**: [Create an issue](https://github.com/codestate-cs/codestate-ui/issues)
- **Feature Requests**: [Start a discussion](https://github.com/codestate-cs/codestate-ui/discussions)
- **Questions**: [Join discussions](https://github.com/codestate-cs/codestate-ui/discussions)

## 🙏 Acknowledgments

- Built with [VS Code Extension API](https://code.visualstudio.com/api)
- UI powered by modern web technologies
- Thanks to all contributors and the open-source community

## 📊 Stats

- **Package Size**: ~24KB (optimized for performance)
- **Dependencies**: Minimal external dependencies
- **Performance**: Fast startup and low memory usage

---

**Made with ❤️ by the CodeState team**

[⭐ Star us on GitHub](https://github.com/codestate-cs/codestate-ui) | [📖 Documentation](https://github.com/codestate-cs/codestate-ui/wiki) | [🐛 Report Issues](https://github.com/codestate-cs/codestate-ui/issues)