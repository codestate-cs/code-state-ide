# Changelog

All notable changes to CodeState IDE will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [Unreleased]

### Added
- TBD

### Changed
- TBD

### Fixed
- TBD

## [1.2.1] - 2024-09-18

### Added
- Updated @codestate/ui package to latest version
- Enhanced CI/CD pipeline with production configuration switching
- Improved build process with npm run switch:prod integration

### Changed
- Updated UI library dependencies for better performance
- Enhanced build system to use production configuration
- Improved CI/CD workflow for more reliable releases

### Fixed
- Resolved CI/CD authentication issues
- Improved build consistency across environments
- Enhanced production build process

## [1.2.0] - 2024-09-18

### Added
- Activity Bar webview with help and documentation links
- Custom icon support for the extension
- GitHub repository integration
- Comprehensive documentation and contributing guidelines
- Proper UI library bundling system
- Automated UI file copying in build process
- Auto-tagging system for releases
- Complete CI/CD pipeline with automated publishing
- User-focused README.md for VS Code marketplace
- Comprehensive DEVELOPMENT.md for contributors
- Demo GIF showcasing extension functionality

### Changed
- Migrated from TreeView to WebView for Activity Bar
- Updated package configuration for better marketplace integration
- Optimized extension size and performance
- Updated all repository URLs to correct GitHub repository
- Improved webview resource loading system
- UI library files now bundled in `resources/ui/` directory
- Enhanced build system with automatic file copying
- Restructured documentation for better user experience

### Fixed
- **HTMLElement is not defined** error during extension activation
- Webview UI library loading issues (401 Unauthorized errors)
- Incorrect repository references in documentation
- UI library bundling for packaged extensions
- Configuration dialog loading issues
- TypeScript compilation errors
- Extension activation performance
- Resource path resolution in webview context

## [0.0.1] - 2024-09-15

### Added
- Initial release of CodeState IDE extension
- AI-powered code assistance features
- WebView integration with VS Code
- Configuration management system
- Activity Bar integration
- Status bar integration
- Context menu integration
- Command palette integration
- Tree shaking and optimization
- External dependency management
- Custom UI components
- Message handling system
- Auto-resume service
- Logger utility
- TypeScript support
- ESLint configuration
- Build system with esbuild
- Package optimization with .vscodeignore

### Features
- **Main WebView**: Full-featured CodeState IDE interface
- **Activity Bar**: Quick access and help panel
- **Configuration**: IDE selection and settings management
- **Performance**: Optimized bundle size (~24KB)
- **Integration**: Seamless VS Code integration

### Technical Details
- Extension size: ~24KB
- Main bundle: ~40KB
- Dependencies: Externalized for optimal size
- Tree shaking: Enabled for production builds
- TypeScript: Strict mode enabled
- Linting: ESLint with VS Code standards

---

## Version History

### 0.0.1 (Initial Release)
- Core functionality implementation
- Basic UI and webview integration
- Configuration system
- Activity Bar webview
- Performance optimizations
- Documentation and open source preparation

---

## Release Notes

### Breaking Changes
- None in current version

### Migration Guide
- No migration required for initial release

### Known Issues
- Configuration dialog may show loading state on first open (resolved in development)
- Activity Bar webview requires workspace to be open

### Deprecations
- None in current version

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for information about contributing to this project.

## Support

- **Issues**: [GitHub Issues](https://github.com/codestate-cs/code-state-ide/issues)
- **Discussions**: [GitHub Discussions](https://github.com/codestate-cs/code-state-ide/discussions)
- **Documentation**: [Wiki](https://github.com/codestate-cs/code-state-ide/wiki)