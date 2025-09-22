# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Universal File Viewer is a Firefox extension that beautifies and adds syntax highlighting to various file formats displayed in the browser. It uses a plugin-based architecture with three core services: FileDetector, Formatter, and Highlighter.

## Common Commands

### Development
- `npm run setup` - Download dependencies (js-yaml)
- `npm start` - Run extension in Firefox for development
- `npm run build` - Build extension package
- `npm run lint` - Lint extension code
- `npm test` - Run Jest tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report

### Alternative Make Commands
- `make setup` - Download dependencies
- `make run` - Start Firefox with extension
- `make build` - Create development build
- `make production` - Create minified production build
- `make lint` - Lint the extension
- `make test` - Run tests
- `make watch` - Watch files and rebuild on changes

### Testing
- Single test: `jest test/formats/json.test.js`
- Format-specific tests are in `test/formats/`

## Architecture

### Core Services (js/core/)
1. **FileDetector** (`detector.js`) - Determines file format using MIME types, extensions, and content patterns
2. **Formatter** (`formatter.js`) - Parses and formats text data
3. **Highlighter** (`highlighter.js`) - Applies syntax highlighting with pattern-based or token-based approaches
4. **Viewer** (`viewer.js`) - Renders UI and handles user interactions

### Format Handlers (js/formats/)
Each format (JSON, YAML, XML, CSV, TOML) registers itself with the three core services. To add a new format:
1. Create `js/formats/newformat.js`
2. Register with FileDetector, Formatter, and Highlighter
3. Add script to `manifest.json` content_scripts array
4. Create tests in `test/formats/newformat.test.js`

### Plugin Registration Pattern
```javascript
// Detection
FileDetector.register('format-name', {
  mimeTypes: ['application/format'],
  extensions: ['ext'],
  contentMatcher: (content) => content.startsWith('signature'),
  priority: 10
});

// Parsing/Formatting
Formatter.register('format-name', {
  parse: (text) => { /* parse logic */ },
  format: (data, options) => { /* format logic */ },
  validate: (data) => { /* validation */ }
});

// Highlighting
Highlighter.register('format-name', {
  patterns: {
    [Highlighter.TokenType.STRING]: /regex/g,
    // or tokenize function for complex highlighting
  }
});
```

### Entry Points
- `js/main.js` - Main content script entry point
- `js/background.js` - Background service worker
- `popup.js` - Browser action popup

## Key Files
- `manifest.json` - Extension configuration and permissions
- `setup.js` - Downloads external dependencies (js-yaml)
- `jest.config.js` - Test configuration
- External dependency: `lib/js-yaml.min.js` (downloaded by setup)

## Dependencies
- Runtime: js-yaml (downloaded by setup script)
- Development: web-ext, jest, eslint

## Extension Structure
- Supports Firefox manifest v2
- Uses content scripts to inject into all URLs
- Storage API for user preferences
- Clipboard API for copy functionality
- No external runtime dependencies except js-yaml for YAML support