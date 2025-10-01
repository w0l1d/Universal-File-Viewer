# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Universal File Viewer is a Firefox extension that provides a native-style viewer for structured file formats (JSON, YAML, XML, CSV, TOML). It intercepts file downloads and displays them in a beautiful, interactive interface with syntax highlighting, tree views, and search capabilities.

## Common Commands

### Development
- `npm run setup` or `node setup.js` - Download runtime dependencies (js-yaml, highlight.js, Prism.js)
- `npm start` - Run extension in Firefox for development (requires web-ext)
- `npm run build` - Build extension package for distribution
- `npm run lint` - Lint extension code with web-ext
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
- Run all tests: `npm test`
- Single test file: `jest test/formats/json.test.js`
- Format-specific tests are in `test/formats/` (note: directory may not exist yet)

## Architecture

This extension uses a **dual-mode architecture**:

### 1. Content Script Mode (`js/content.js`)
- Runs on all web pages via content_scripts in manifest.json
- Detects plain text file displays (single `<pre>` tag or empty body)
- Performs client-side format detection and rendering
- Self-contained with embedded FormatHandler, TreeView, and NativeViewer classes
- Activates automatically when viewing raw text files in browser

### 2. Download Interception Mode (`js/background.js` + `viewer.html` + `js/viewer.js`)
- **Background Script**: Intercepts file downloads using webRequest API
  - Monitors `onBeforeRequest` and `onHeadersReceived` for supported file types
  - Pre-fetches content and caches it in browser.storage.local
  - Redirects to custom viewer page with file metadata in URL hash
- **Viewer Page**: Dedicated viewer interface (viewer.html)
  - InlineViewer class handles rendering (js/viewer.js)
  - Retrieves cached content from background script
  - Provides Pretty/Raw toggle, search, headers modal, download, and copy URL
  - Uses Prism.js for syntax highlighting in raw view

### Key Architectural Points
- **No core services structure**: The original plugin architecture with FileDetector, Formatter, Highlighter core services does NOT exist in this codebase
- **Format detection is inline**: Both content.js and viewer.js have their own FormatHandler implementations
- **Two independent viewers**: Content script and viewer page are separate implementations sharing similar functionality
- **Caching mechanism**: Background script pre-fetches and caches content in browser.storage.local with 5-minute expiration
- **Message passing**: Viewer communicates with background script using browser.runtime.sendMessage for file fetching and cache retrieval

### Entry Points
- `js/content.js` - Content script injected into all pages for inline viewing
- `js/background.js` - Background script for download interception and file fetching
- `js/viewer.js` - Viewer page implementation (InlineViewer class)
- `viewer.html` - Dedicated viewer page UI
- `popup.js` - Browser action popup (if exists)

## Key Files
- `manifest.json` - Extension configuration, permissions, and content scripts
- `setup.js` - Downloads external dependencies (js-yaml, highlight.js, Prism.js, json-viewer)
- `viewer.html` - Viewer page template
- `css/viewer.css` - All viewer styles
- `jest.config.js` - Test configuration
- `Makefile` - Alternative build system with Make commands

## Dependencies

### Runtime Dependencies (Downloaded by setup.js)
- `js-yaml` (4.1.0) - YAML parsing
- `highlight.js` (11.11.1) - Syntax highlighting library
- `json-viewer` (2.1.0) - JSON tree viewer web component
- Stored in `lib/` directory

### Development Dependencies (npm)
- `web-ext` - Firefox extension development and testing tool
- `jest` - JavaScript testing framework
- `jest-environment-jsdom` - DOM environment for Jest
- `eslint` - Code linting

## Extension Structure
- **Manifest v2** for Firefox
- **Permissions**: `<all_urls>`, `storage`, `webRequest`, `webRequestBlocking`
- **Content scripts**: Injected into all URLs at document_end
- **Web accessible resources**: viewer.html, CSS, lib files, icons
- **Background script**: Non-persistent (event page)

## Important Implementation Notes
- Content script checks if page should activate: single `<pre>` tag or empty body
- Background script pre-fetches content during interception to avoid CORS issues
- Viewer page receives file info via URL hash (originalUrl, format, cacheKey, etc.)
- Both viewers support JSON, YAML, XML, CSV, TOML formats
- Tree view for structured data (JSON/YAML/XML), table view for CSV, code view for raw text
- Search functionality with highlighting in pretty view
- Security: Input validation, size limits (50MB), nesting depth checks (1000 levels)