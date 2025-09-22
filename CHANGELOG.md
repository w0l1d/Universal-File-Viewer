# Changelog

All notable changes to the Universal File Viewer extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive API documentation in `docs/API.md`
- Contributing guidelines in `CONTRIBUTING.md`
- GitHub issue and pull request templates
- Improved .gitignore for better repository management

### Changed
- Updated README.md with comprehensive project documentation
- Enhanced project structure for better GitHub integration

## [1.0.0] - 2024-01-XX

### Added
- **Professional Syntax Highlighting** - Integrated Highlight.js for industry-standard syntax highlighting
- **Interactive Tree View** - Added JSON Viewer Web Component for collapsible tree structure display
- **Dual View Mode** - Toggle between tree view and syntax-highlighted code view
- **Expand/Collapse All** - Buttons to expand or collapse entire tree structure at once
- **Enhanced File Operations**
  - Copy content to clipboard functionality
  - Download files with proper filename and content type
  - View raw file content in new tab
  - Direct link access to original file URL
- **Automated Dependency Management** - Setup script downloads all required libraries
- **Format Support**
  - JSON with tree view and syntax highlighting
  - YAML with tree view and syntax highlighting
  - XML parsing and syntax highlighting
  - CSV formatting support
  - TOML basic support
- **Error Handling** - Graceful handling of malformed files with user-friendly error messages
- **File Information Display** - Shows file size, type, and character count
- **Professional UI** - Clean, modern interface with proper theming

### Technical Improvements
- **Plugin Architecture** - Extensible system for adding new file format support
- **Service-Oriented Design** - Separate services for detection, formatting, and highlighting
- **Memory Management** - Proper cleanup of blob URLs and resources
- **State Management** - Robust state handling for view transitions
- **Event System** - Custom event system for component communication
- **Testing Framework** - Jest-based testing with format-specific test organization
- **Build System** - NPM and Make-based build system with linting and testing
- **CSP Compliance** - Content Security Policy compliant code

### Dependencies
- **Runtime Dependencies** (auto-downloaded):
  - js-yaml 4.1.0 - YAML parsing and formatting
  - Highlight.js 11.11.1 - Professional syntax highlighting
  - JSON Viewer Web Component 2.1.0 - Interactive tree view
- **Development Dependencies**:
  - web-ext - Firefox extension development tools
  - jest - JavaScript testing framework
  - eslint - Code linting and style checking

### Security
- **No eval() usage** - All code avoids dynamic code execution
- **Input validation** - Comprehensive validation of all user inputs and file content
- **CSP compliance** - Works within Content Security Policy restrictions
- **Minimal permissions** - Requests only necessary browser permissions

### Performance
- **Lazy loading** - Format handlers loaded only when needed
- **Efficient rendering** - Optimized highlighting and tree view rendering
- **Memory optimization** - Proper resource cleanup and memory management
- **Caching** - Parsed results and highlighted content cached during session

### Bug Fixes
- Fixed expand all functionality that was incorrectly collapsing nodes
- Resolved syntax highlighting loss when toggling between views
- Fixed timing issues with Web Component method availability
- Improved error handling for malformed YAML and JSON files

### Breaking Changes
- Replaced custom highlighting system with Highlight.js (affects custom themes)
- Changed file detection priority system (may affect format detection order)
- Updated manifest permissions (requires reinstallation for existing users)

---

## Development Notes

### Version Numbering
- **Major version** (X.0.0): Breaking changes, major new features
- **Minor version** (0.X.0): New features, backwards compatible
- **Patch version** (0.0.X): Bug fixes, minor improvements

### Release Process
1. Update version in `manifest.json`
2. Update `CHANGELOG.md` with release date and final changes
3. Run tests: `npm test`
4. Build extension: `npm run build`
5. Create GitHub release with built extension package
6. Tag release in git: `git tag v1.0.0`

### Migration Guide

#### From Custom Highlighting to Highlight.js
If you were using custom highlighting themes, you'll need to:
1. Update CSS to use Highlight.js classes (`.hljs-*`)
2. Review color schemes for compatibility
3. Test with all supported file formats

#### For Extension Developers
- Format handlers now use standardized token types
- Detection system uses priority-based ordering
- Error handling must return structured objects
- Tests should follow the new format in `test/formats/`

---

## Roadmap

### Next Release (1.1.0)
- [ ] Support for more file formats (INI, ENV, LOG)
- [ ] Custom theme support
- [ ] Advanced search and filtering in tree view
- [ ] Performance improvements for large files
- [ ] Accessibility enhancements

### Future Releases
- [ ] Binary file viewer (hex editor)
- [ ] Diff view for comparing files
- [ ] Export to different formats
- [ ] JSONPath/XPath query support
- [ ] Plugin marketplace for community formats
- [ ] Chrome extension port
- [ ] Offline documentation viewer

---

## Contributors

- Initial development and architecture
- Professional highlighting integration
- Tree view implementation
- Testing framework setup
- Documentation and GitHub integration

## Acknowledgments

- [Highlight.js](https://highlightjs.org/) - Professional syntax highlighting
- [JSON Viewer Web Component](https://github.com/alenaksu/json-viewer) - Interactive tree view
- [js-yaml](https://github.com/nodeca/js-yaml) - YAML parsing support
- Firefox Add-ons team for excellent documentation and tools