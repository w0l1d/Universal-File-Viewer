# Universal File Viewer - Firefox Extension

A professional Firefox extension that provides a native-style viewer for structured file formats (JSON, YAML, XML, CSV, TOML). It intercepts file downloads and displays them in a beautiful, interactive interface with syntax highlighting, tree views, and search capabilities.

## ✨ Features

- 🎨 **Professional Syntax Highlighting** - Powered by Prism.js with language-specific themes
- 🌳 **Interactive Tree View** - Collapsible tree structure for JSON/YAML/XML files
- 🔍 **Advanced Search** - Full-text search in both pretty and raw views with highlighting
- 📋 **Copy to Clipboard** - Copy file URL or entire content with one click
- 💾 **Download Files** - Download with proper filename and MIME type
- 🔄 **Dual View Mode** - Toggle between pretty tree view and syntax-highlighted raw code
- 📊 **Rich Metadata** - Display file size, content type, modified date, encoding, ETag, and line count
- 🌐 **HTTP Headers Viewer** - View request and response headers in dedicated modal
- ⚡ **Synchronized Hover** - Clear line number correlation with hover highlights
- ⚠️ **Error Handling** - Graceful handling of malformed files and network errors (403, 404, etc.)
- 🔒 **Security Features** - 50MB size limit, nesting depth validation, XSS protection
- 🚀 **Smart Caching** - 5-minute content cache for fast repeated access

## 🏗️ Architecture

This extension uses a **dual-mode architecture** for maximum coverage:

### 1. Content Script Mode (`js/content.js`)
- Runs on all web pages via `content_scripts` in manifest.json
- Detects plain text file displays (single `<pre>` tag or empty body)
- Performs client-side format detection and rendering
- Self-contained with embedded FormatHandler, TreeView, and NativeViewer classes
- Activates automatically when viewing raw text files in browser

### 2. Download Interception Mode (`js/background.js` + `viewer.html` + `js/viewer.js`)
- **Background Script**: Intercepts file downloads using webRequest API
  - Monitors `onBeforeRequest` and `onHeadersReceived` for supported file types
  - Pre-fetches content and caches it in browser.storage.local (5-minute expiration)
  - Redirects to custom viewer page with file metadata in URL hash
- **Viewer Page**: Dedicated viewer interface (viewer.html)
  - InlineViewer class handles rendering (js/viewer.js)
  - Retrieves cached content from background script
  - Provides Pretty/Raw toggle, search, headers modal, download, and copy URL
  - Uses Prism.js for syntax highlighting in raw view

### Key Architectural Points
- **No core services structure**: Format detection, parsing, and highlighting are inline in each viewer
- **Format detection is inline**: Both content.js and viewer.js have their own FormatHandler implementations
- **Two independent viewers**: Content script and viewer page are separate implementations sharing similar functionality
- **Caching mechanism**: Background script pre-fetches and caches content in browser.storage.local
- **Message passing**: Viewer communicates with background script using browser.runtime.sendMessage
- **Security**: Input validation, 50MB size limit, 1000 nesting depth limit, XSS protection via DOM methods

## 📁 Project Structure

```
.
├── js/
│   ├── background.js      # Background script (download interception, caching)
│   ├── content.js         # Content script (inline file detection and rendering)
│   └── viewer.js          # Viewer page logic (InlineViewer class)
├── css/
│   └── viewer.css         # All viewer styles (tree view, code viewer, modals)
├── lib/                   # Runtime dependencies (downloaded by setup.js)
│   ├── js-yaml.min.js     # YAML parser (4.1.0)
│   └── prism/             # Prism.js syntax highlighting (11.11.1)
├── icons/                 # Extension icons
├── viewer.html            # Dedicated viewer page template
├── manifest.json          # Extension configuration (Manifest v2)
├── setup.js               # Dependency download script
├── CLAUDE.md              # AI assistant instructions
└── README.md              # This file
```

## Adding New File Formats

To add support for a new file format, you need to update the FormatHandler in both viewers:

### 1. Update Background Script (`js/background.js`)
Add MIME type and extension detection:
```javascript
const SUPPORTED_FORMATS = {
  'application/json': 'json',
  'application/x-yaml': 'yaml',
  'application/your-format': 'your-format',  // Add your format
  // ...
};
```

### 2. Update Content Script (`js/content.js`)
Add format detection in FormatHandler class:
```javascript
detectFormat(text) {
  // Add your format detection logic
  if (text.startsWith('YOUR_SIGNATURE')) {
    return 'your-format';
  }
  // ...
}
```

### 3. Update Viewer (`js/viewer.js`)
Add parser and renderer:
```javascript
parseContent(content, format) {
  switch (format.toLowerCase()) {
    case 'your-format':
      return this.parseYourFormat(content);
    // ...
  }
}

parseYourFormat(content) {
  // Parse your format into a tree structure
  return parsedData;
}
```

### 4. Add Prism.js Language Support (Optional)
For syntax highlighting in raw view, add Prism.js language file in `viewer.html`:
```html
<script src="lib/prism/prism-your-format.min.js"></script>
```

## 🚀 Quick Start

### Automatic Setup (Recommended)

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd universal-file-viewer
   ```

2. **Run setup script** to download all dependencies:
   ```bash
   node setup.js
   ```

3. **Load in Firefox**:
   - Navigate to `about:debugging`
   - Click "This Firefox"
   - Click "Load Temporary Add-on"
   - Select `manifest.json`

### Development with NPM

```bash
# Install development dependencies
npm install

# Download runtime dependencies (js-yaml, highlight.js, json-viewer)
npm run setup

# Start development server
npm start

# Build extension package
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

### Alternative with Make

```bash
# Setup dependencies
make setup

# Start Firefox with extension
make run

# Build for production
make production

# Run tests
make test
```

## 📂 Supported Formats

- **JSON** - Full JSON support with tree view and syntax highlighting
- **YAML** - Complete YAML 1.2 support with tree view
- **XML** - XML parsing and syntax highlighting
- **CSV** - Comma-separated values with table formatting
- **TOML** - Tom's Obvious Minimal Language support

## 🎯 Usage

### Keyboard Shortcuts
- **Ctrl/Cmd + F** - Focus search box
- **Ctrl/Cmd + R** - Toggle between Pretty and Raw view
- **Ctrl/Cmd + S** - Download file
- **Ctrl/Cmd + U** - Copy original URL to clipboard
- **Ctrl/Cmd + H** - Show headers modal
- **Escape** - Close headers modal

### Tree View Features (Pretty Mode)
- **Interactive Navigation** - Click ▶/▼ icons to expand/collapse nodes
- **Nested Structures** - Automatic indentation and collapsible nodes for objects/arrays
- **Item Count** - Shows number of items in collapsed nodes
- **Search Highlighting** - Search term highlighted in yellow
- **Type Colors** - Different colors for strings, numbers, booleans, null values

### Raw Code View Features
- **Line Numbers** - Left-aligned line numbers with synchronized hover
- **Syntax Highlighting** - Language-specific color schemes via Prism.js
- **Search Support** - Full-text search with yellow highlights
- **Copy Button** - Quick copy of entire code content
- **Hover Feedback** - Blue accent bar and background highlight on hover

### File Operations
- **Headers Button** - View HTTP request and response headers in modal
- **Copy URL** - Copy original file URL to clipboard with visual feedback
- **Download** - Save file with original filename and proper MIME type
- **Search** - Real-time search in both pretty and raw views

### Metadata Display
The viewer shows useful file metadata:
- **Content-Type** - MIME type of the file
- **Modified** - Last modified date (if available)
- **Encoding** - Content encoding (gzip, br, etc.)
- **ETag** - Cache validation token (shortened)
- **Lines** - Total line count

## 🔒 Security Features

1. **Input Validation**
   - File size limit: 50MB maximum
   - Nesting depth limit: 1000 levels for JSON/YAML
   - XML entity reference blocking to prevent XML bombs

2. **XSS Protection**
   - All user content escaped via `textContent` and `escapeHtml()`
   - Minimal use of `innerHTML`, only for trusted Prism.js output
   - DOM manipulation preferred over string concatenation

3. **Content Security**
   - Blob URLs properly cleaned up after use
   - No eval() or Function() constructor usage
   - Sandboxed iframe not required due to safe practices

4. **Network Security**
   - CORS mode enabled for fetch requests
   - Response headers captured even for error responses
   - No credential exposure in request headers display

## API Reference

### InlineViewer Class (js/viewer.js)

Main viewer class that handles rendering and interactions:

**Methods:**
- `loadFileFromHash()` - Parse URL hash and load file data
- `fetchAndDisplayFile()` - Fetch content via background script
- `displayContent()` - Render content based on current view mode
- `displayPrettyContent()` - Render tree view for structured data
- `displayRawContent()` - Render syntax-highlighted code view
- `parseContent(content, format)` - Parse content into data structure
- `switchView(view)` - Toggle between 'pretty' and 'raw' views
- `highlightSearchResults()` - Apply search highlighting
- `showHeadersModal()` - Display HTTP headers modal
- `downloadFile()` - Trigger file download
- `copyOriginalUrl()` - Copy URL to clipboard

**Security Methods:**
- `validateParseInput(content, format)` - Validate input before parsing
- `escapeHtml(text)` - Escape HTML entities for safe display

### Background Script (js/background.js)

**Message Handlers:**
- `fetchFile` - Fetch file from URL and return with headers
- `getCachedContent` - Retrieve cached content from storage
- `trackUsage` - Log format usage statistics

**Interceptors:**
- `onBeforeRequest` - Intercept file downloads and pre-fetch content
- `onHeadersReceived` - Redirect to viewer page for supported formats

## 🔧 Dependencies

### Runtime Dependencies (Downloaded by setup.js)
- **js-yaml** (4.1.0) - YAML parsing library
- **Prism.js** (11.11.1) - Lightweight syntax highlighting
  - prism-core.min.js - Core highlighting engine
  - prism-json.min.js - JSON language support
  - prism-yaml.min.js - YAML language support
  - prism-markup.min.js - XML/HTML language support
  - prism-csv.min.js - CSV language support
  - prism-toml.min.js - TOML language support

### Development Dependencies
- **web-ext** - Firefox extension development and testing tool
- **jest** - JavaScript testing framework
- **jest-environment-jsdom** - DOM environment for Jest
- **eslint** - Code linting and style checking

## 📈 Performance Considerations

- **Smart Caching**: 5-minute cache in browser.storage.local for repeat views
- **Pre-fetching**: Background script fetches content during interception to avoid CORS
- **Efficient Rendering**: Tree view collapses nested structures by default
- **Memory Management**: Blob URLs cleaned up after download operations
- **Optimized Highlighting**: Prism.js manual mode for on-demand syntax highlighting
- **Size Limits**: 50MB file size limit prevents browser freezing
- **Event Delegation**: Single click handler for tree expansion/collapse

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Test specific format
jest test/formats/json.test.js
```

Test files are organized by format in the `test/formats/` directory.

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines, coding standards, and how to add new file format support.

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and release notes.

## 🛠️ Troubleshooting

### Common Issues

1. **Extension not loading**:
   - Ensure all dependencies are downloaded with `node setup.js`
   - Check that `lib/` directory exists and contains js-yaml and prism files
   - Verify manifest.json has correct permissions

2. **Files downloading instead of viewing**:
   - The extension intercepts requests and redirects to viewer
   - Check browser console for interception logs (🦊 emoji)
   - Ensure file has supported MIME type or extension

3. **YAML parsing errors**:
   - Verify file is valid YAML format
   - Check for tab characters (YAML requires spaces)
   - Look for duplicate keys or invalid indentation

4. **Tree view not expanding**:
   - Click the ▶/▼ icon, not the text
   - Check browser console for JavaScript errors
   - Verify data structure is valid JSON/YAML

5. **Search not working**:
   - Ensure search term is at least 2 characters
   - Search is case-insensitive
   - Works in both pretty and raw views

6. **Line numbers misaligned**:
   - This usually indicates CSS loading issue
   - Check that viewer.css is properly linked
   - Clear browser cache and reload

### Debug Mode

Enable detailed logging by opening browser console (F12) when viewing files. The extension provides comprehensive logging with 🦊 emoji prefix:

```
🦊 InlineViewer constructor called
🦊 Loading file: {originalUrl, format, cacheKey}
🦊 Fetch response: {success, content, headers}
🦊 Response headers stored: {...}
```

### Error Messages

- **"Failed to load file: HTTP 403"** - Server denied access, but headers are still viewable
- **"File too large: X MB exceeds limit of 50MB"** - File exceeds safety limit
- **"XML contains entity references"** - XML bomb protection triggered
- **"YAML parser not available"** - js-yaml.min.js not loaded, run setup.js

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🔗 Links

- [Firefox Add-ons Developer Guide](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons)
- [Highlight.js Documentation](https://highlightjs.org/)
- [JSON Viewer Web Component](https://github.com/alenaksu/json-viewer)