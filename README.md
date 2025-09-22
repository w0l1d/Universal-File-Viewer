# Universal File Viewer - Firefox Extension

A professional Firefox extension that beautifies and adds syntax highlighting to various file formats displayed in the browser. Features include tree view for structured data, professional syntax highlighting, and an extensible plugin architecture.

## ✨ Features

- 🎨 **Professional Syntax Highlighting** - Powered by Highlight.js
- 🌳 **Interactive Tree View** - Collapsible tree structure for JSON/YAML files
- 📋 **Copy to Clipboard** - One-click copying of file content
- 💾 **Download Files** - Download formatted or raw versions
- 🔄 **Dual View Mode** - Toggle between tree view and syntax-highlighted code view
- 📊 **File Information** - Display file size, type, and character count
- ⚠️ **Error Handling** - Graceful handling of malformed files
- 🚀 **Zero Runtime Dependencies** - Self-contained with bundled libraries

## 🏗️ Architecture

### Core Services

The extension follows a modular architecture with clear separation of concerns:

```
js/
├── core/
│   ├── detector.js     # File format detection service
│   ├── formatter.js    # Parsing and formatting service
│   ├── highlighter.js  # Syntax highlighting service
│   └── viewer.js       # UI rendering and interactions
├── formats/
│   ├── json.js        # JSON format handler
│   ├── yaml.js        # YAML format handler
│   ├── xml.js         # XML format handler
│   ├── csv.js         # CSV format handler
│   └── toml.js        # TOML format handler
├── background.js      # Background service worker
├── main.js           # Content script entry point
└── viewer-page.js    # Viewer page logic
```

### Key Design Principles

1. **Plugin Architecture**: Each file format is a self-contained module that registers itself with core services
2. **Separation of Concerns**: Detection, parsing, formatting, and highlighting are independent services
3. **Extensibility**: Adding new formats requires only creating a new format handler
4. **Professional Libraries**: Uses industry-standard libraries (Highlight.js, JSON Viewer Web Component)

## Adding New File Formats

To add support for a new file format, create a new file in `js/formats/` with three registrations:

### 1. Register Detector

```javascript
FileDetector.register('format-name', {
  mimeTypes: ['application/format'],     // MIME types to match
  extensions: ['ext', 'ext2'],          // File extensions
  contentMatcher: (content) => {        // Content pattern matching
    return content.startsWith('signature');
  },
  priority: 10                          // Higher = checked first
});
```

### 2. Register Formatter

```javascript
Formatter.register('format-name', {
  parse: (text) => {
    // Parse text into data structure
    return parsedData;
  },
  
  format: (data, options) => {
    // Format data back to text
    return formattedText;
  },
  
  validate: (data) => {
    // Optional validation
    return { valid: true };
  }
});
```

### 3. Register Highlighter

Choose between pattern-based (simple) or token-based (complex) highlighting:

```javascript
// Pattern-based (regex)
Highlighter.register('format-name', {
  patterns: {
    [Highlighter.TokenType.STRING]: /regex/g,
    [Highlighter.TokenType.NUMBER]: /regex/g,
    // ...
  }
});

// Token-based (precise)
Highlighter.register('format-name', {
  tokenize: (text) => {
    const tokens = [];
    // Parse and return token array
    return tokens;
  }
});
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

### Tree View Features
- **Interactive Navigation** - Click to expand/collapse nodes
- **Expand All** - Button to expand entire tree structure
- **Collapse All** - Button to collapse back to root level
- **Toggle Views** - Switch between tree view and syntax-highlighted code view

### File Operations
- **Copy Content** - Copy original or formatted content to clipboard
- **Download File** - Save file with proper filename and content type
- **View Raw** - Open original file content in new tab
- **Direct Link** - Access original file URL

## Token Types

The highlighter supports these token types for consistent theming:

- `STRING` - String literals
- `NUMBER` - Numeric values
- `BOOLEAN` - Boolean values
- `NULL` - Null/nil values
- `KEY` - Object keys/properties
- `KEYWORD` - Language keywords
- `COMMENT` - Comments
- `OPERATOR` - Operators
- `PUNCTUATION` - Brackets, commas, etc.
- `VARIABLE` - Variables/references
- `FUNCTION` - Function names
- `CLASS` - Class names
- `TAG` - XML/HTML tags
- `ATTRIBUTE` - Attributes
- `ERROR` - Error tokens

## API Reference

### FileDetector
- `register(format, detector)` - Register format detector
- `detect()` - Detect current page format
- `getDetector(format)` - Get detector config

### Formatter
- `register(format, handler)` - Register format handler
- `parse(text, format)` - Parse text
- `format(data, format, options)` - Format data
- `hasFormatter(format)` - Check if formatter exists

### Highlighter
- `register(format, highlighter)` - Register highlighter
- `highlight(text, format)` - Apply highlighting
- `getTokenTypes()` - Get available token types

### Viewer
- `render(config)` - Render the UI

## 🔧 Dependencies

### Runtime Dependencies (Downloaded by setup.js)
- **js-yaml** (4.1.0) - YAML parsing and formatting
- **highlight.js** (11.11.1) - Professional syntax highlighting
- **JSON Viewer Web Component** (2.1.0) - Interactive tree view for JSON/YAML

### Development Dependencies
- **web-ext** - Firefox extension development and testing
- **jest** - JavaScript testing framework
- **eslint** - Code linting and style checking

## 📈 Performance Considerations

- **Lazy Loading**: Format handlers are loaded only when needed
- **Efficient Rendering**: Tree view uses virtual scrolling for large datasets
- **Memory Management**: Blob URLs are properly cleaned up
- **Optimized Highlighting**: Highlight.js provides efficient syntax highlighting
- **Caching**: Parsed results and highlighted content are cached during session

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

1. **Extension not loading**: Ensure all dependencies are downloaded with `node setup.js`
2. **Tree view not working**: Check browser console for JavaScript errors
3. **Files downloading instead of viewing**: The extension intercepts requests and redirects to viewer
4. **YAML parsing errors**: Ensure file is valid YAML format

### Debug Mode

Enable debug logging by opening browser console when viewing files. The extension provides detailed logging for troubleshooting.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🔗 Links

- [Firefox Add-ons Developer Guide](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons)
- [Highlight.js Documentation](https://highlightjs.org/)
- [JSON Viewer Web Component](https://github.com/alenaksu/json-viewer)