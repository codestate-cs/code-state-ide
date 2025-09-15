# Contributing to CodeState IDE

Thank you for your interest in contributing to CodeState IDE! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Issues

Before creating an issue, please:
- Check if the issue already exists
- Use the latest version of the extension
- Provide detailed information about the problem

When reporting bugs, include:
- VS Code version
- Extension version
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

### Suggesting Features

We welcome feature suggestions! Please:
- Check existing discussions first
- Provide a clear description of the feature
- Explain the use case and benefits
- Consider implementation complexity

## 🛠️ Development Setup

### Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: Latest version
- **VS Code**: Latest stable version
- **Git**: For version control

### Getting Started

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/codestate-ui.git
   cd codestate-ui
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Build the Extension**
   ```bash
   npm run package
   ```

4. **Install in Development Mode**
   ```bash
   code --install-extension codestate-ide-0.0.1.vsix
   ```

### Development Workflow

1. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make Changes**
   - Follow the coding standards
   - Add tests if applicable
   - Update documentation

3. **Test Your Changes**
   ```bash
   npm run check-types  # TypeScript checking
   npm run lint         # Code linting
   npm run package      # Build package
   ```

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## 📋 Coding Standards

### TypeScript Guidelines

- Use TypeScript strict mode
- Prefer interfaces over types for object shapes
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Follow existing code patterns

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Add trailing commas in objects/arrays
- Use semicolons consistently
- Follow ESLint configuration

### File Organization

```
src/
├── extension.ts          # Main entry point
├── webview/              # WebView providers
│   ├── WebviewProvider.ts
│   └── HelpWebviewProvider.ts
├── handlers/             # Message handlers
├── services/             # Background services
├── utils/                # Utility functions
└── types/                # Type definitions
```

## 🧪 Testing

### Manual Testing

1. **Install Development Version**
   ```bash
   npm run package
   code --install-extension codestate-ide-0.0.1.vsix --force
   ```

2. **Test Scenarios**
   - Extension activation
   - WebView opening
   - Command execution
   - Settings configuration
   - Activity Bar integration

### Automated Testing

- TypeScript compilation (`npm run check-types`)
- ESLint validation (`npm run lint`)
- Build verification (`npm run package`)

## 📝 Documentation

### Code Documentation

- Add JSDoc comments for functions and classes
- Document complex algorithms or business logic
- Include examples for public APIs

### User Documentation

- Update README.md for user-facing changes
- Add screenshots for UI changes
- Update installation instructions if needed

## 🚀 Release Process

### Version Bumping

We follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist

- [ ] Update version in `package.json`
- [ ] Update `CHANGELOG.md`
- [ ] Test all functionality
- [ ] Update documentation
- [ ] Create release tag
- [ ] Publish to marketplace

## 🏷️ Commit Message Format

We use conventional commits:

```
type(scope): description

feat(webview): add new help panel
fix(config): resolve loading issue
docs(readme): update installation guide
refactor(utils): simplify helper functions
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions/changes
- `chore`: Build/tooling changes

## 🐛 Debugging

### VS Code Extension Development

1. **Open Extension Development Host**
   ```bash
   code --extensionDevelopmentPath=/path/to/codestate-ui
   ```

2. **Use Debug Console**
   - Open Developer Tools (`Help > Toggle Developer Tools`)
   - Check Console for errors
   - Use `console.log()` for debugging

3. **Extension Logs**
   - Check Output panel for extension logs
   - Use `Developer: Reload Window` to restart

## 📞 Getting Help

- **Discussions**: [GitHub Discussions](https://github.com/codestate-cs/codestate-ui/discussions)
- **Issues**: [GitHub Issues](https://github.com/codestate-cs/codestate-ui/issues)
- **Documentation**: [Wiki](https://github.com/codestate-cs/codestate-ui/wiki)

## 🎯 Project Goals

- **Performance**: Fast, lightweight extension
- **User Experience**: Intuitive and helpful
- **Reliability**: Stable and well-tested
- **Accessibility**: Inclusive design
- **Maintainability**: Clean, documented code

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to CodeState IDE! 🚀