# Universal File Viewer API Documentation

This document provides comprehensive API documentation for the Universal File Viewer extension's plugin architecture.

## Overview

The Universal File Viewer uses a service-oriented architecture with three core services that format handlers register with:

1. **FileDetector** - Determines file format from MIME types, extensions, and content
2. **Formatter** - Parses and formats file content
3. **Highlighter** - Applies syntax highlighting to content

## Core Services

### FileDetector

The FileDetector service determines what format a file is using multiple detection methods.

#### Methods

##### `register(format, detector)`
Registers a new format detector.

**Parameters:**
- `format` (string) - Unique format identifier
- `detector` (object) - Detector configuration

**Detector Configuration:**
```javascript
{
    mimeTypes: string[],        // MIME types to match
    extensions: string[],       // File extensions to match
    contentMatcher?: function,  // Content pattern matching function
    priority: number           // Detection priority (higher = checked first)
}
```

**Example:**
```javascript
FileDetector.register('json', {
    mimeTypes: ['application/json', 'text/json'],
    extensions: ['json', 'jsonc'],
    contentMatcher: (content) => {
        const trimmed = content.trim();
        return (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
               (trimmed.startsWith('[') && trimmed.endsWith(']'));
    },
    priority: 10
});
```

##### `detect()`
Detects the format of the current page.

**Returns:**
```javascript
{
    format: string,     // Detected format name
    confidence: number, // Detection confidence (0-100)
    method: string      // Detection method used
}
```

##### `detectFormat(filename, content, mimeType)`
Detects format from provided parameters.

**Parameters:**
- `filename` (string) - File name with extension
- `content` (string) - File content
- `mimeType` (string) - MIME type from server

**Returns:** Same as `detect()`

##### `getDetector(format)`
Gets detector configuration for a format.

**Parameters:**
- `format` (string) - Format name

**Returns:** Detector configuration object

##### `getAllDetectors()`
Gets all registered detectors.

**Returns:** Object mapping format names to detector configurations

---

### Formatter

The Formatter service handles parsing file content into structured data and formatting it back to text.

#### Methods

##### `register(format, handler)`
Registers a format handler.

**Parameters:**
- `format` (string) - Format identifier
- `handler` (object) - Format handler configuration

**Handler Configuration:**
```javascript
{
    parse: function,      // Parse text to data structure
    format: function,     // Format data structure to text
    validate?: function   // Optional validation function
}
```

**Example:**
```javascript
Formatter.register('json', {
    parse: (text) => {
        try {
            const data = JSON.parse(text);
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    format: (data, options = {}) => {
        try {
            const indent = options.indent || 2;
            const text = JSON.stringify(data, null, indent);
            return { success: true, text };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    validate: (data) => {
        return { valid: typeof data === 'object' };
    }
});
```

##### `parse(text, format)`
Parses text content using the specified format handler.

**Parameters:**
- `text` (string) - Content to parse
- `format` (string) - Format to use for parsing

**Returns:**
```javascript
{
    success: boolean,
    data?: any,        // Parsed data (if success)
    error?: string     // Error message (if failure)
}
```

##### `format(data, format, options)`
Formats data structure back to text.

**Parameters:**
- `data` (any) - Data to format
- `format` (string) - Format to use
- `options` (object) - Formatting options

**Returns:**
```javascript
{
    success: boolean,
    text?: string,     // Formatted text (if success)
    error?: string     // Error message (if failure)
}
```

##### `hasFormatter(format)`
Checks if a formatter exists for the given format.

**Parameters:**
- `format` (string) - Format name

**Returns:** boolean

##### `getFormatter(format)`
Gets the formatter for a specific format.

**Parameters:**
- `format` (string) - Format name

**Returns:** Handler configuration object

---

### Highlighter

The Highlighter service applies syntax highlighting to file content using either pattern-based or token-based approaches.

#### Token Types

The highlighter supports these standard token types:

```javascript
Highlighter.TokenType = {
    STRING: 'string',           // String literals
    NUMBER: 'number',           // Numeric values
    BOOLEAN: 'boolean',         // Boolean values
    NULL: 'null',              // Null/nil values
    KEY: 'key',                // Object keys/properties
    KEYWORD: 'keyword',         // Language keywords
    COMMENT: 'comment',         // Comments
    OPERATOR: 'operator',       // Operators (+, -, etc.)
    PUNCTUATION: 'punctuation', // Brackets, commas, etc.
    VARIABLE: 'variable',       // Variables/references
    FUNCTION: 'function',       // Function names
    CLASS: 'class',            // Class names
    TAG: 'tag',                // XML/HTML tags
    ATTRIBUTE: 'attribute',     // Attributes
    ERROR: 'error'             // Error tokens
};
```

#### Methods

##### `register(format, highlighter)`
Registers a syntax highlighter for a format.

**Parameters:**
- `format` (string) - Format identifier
- `highlighter` (object) - Highlighter configuration

**Highlighter Configuration (Pattern-based):**
```javascript
{
    patterns: {
        [TokenType]: RegExp    // Map token types to regex patterns
    }
}
```

**Highlighter Configuration (Token-based):**
```javascript
{
    tokenize: function        // Custom tokenization function
}
```

**Pattern-based Example:**
```javascript
Highlighter.register('json', {
    patterns: {
        [Highlighter.TokenType.STRING]: /"([^"\\]|\\.)*"/g,
        [Highlighter.TokenType.NUMBER]: /-?\d+(\.\d+)?([eE][+-]?\d+)?/g,
        [Highlighter.TokenType.BOOLEAN]: /\b(true|false)\b/g,
        [Highlighter.TokenType.NULL]: /\bnull\b/g,
        [Highlighter.TokenType.PUNCTUATION]: /[{}[\]:,]/g
    }
});
```

**Token-based Example:**
```javascript
Highlighter.register('custom', {
    tokenize: (text) => {
        const tokens = [];
        // Custom tokenization logic
        // Return array of {type, start, end, text} objects
        return tokens;
    }
});
```

##### `highlight(text, format)`
Applies syntax highlighting to text.

**Parameters:**
- `text` (string) - Text to highlight
- `format` (string) - Format to use for highlighting

**Returns:** string - HTML with syntax highlighting classes

##### `getHighlighter(format)`
Gets highlighter configuration for a format.

**Parameters:**
- `format` (string) - Format name

**Returns:** Highlighter configuration object

##### `getTokenTypes()`
Gets all available token types.

**Returns:** Object with token type constants

---

### Viewer

The Viewer service handles UI rendering and user interactions.

#### Methods

##### `render(config)`
Renders the file viewer UI.

**Parameters:**
- `config` (object) - Viewer configuration

**Configuration:**
```javascript
{
    content: string,        // File content
    format: string,         // Detected format
    filename: string,       // Original filename
    mimeType: string,       // MIME type
    fileUrl: string,        // Original file URL
    enableTreeView: boolean // Enable tree view for structured data
}
```

**Example:**
```javascript
Viewer.render({
    content: jsonContent,
    format: 'json',
    filename: 'data.json',
    mimeType: 'application/json',
    fileUrl: 'https://example.com/data.json',
    enableTreeView: true
});
```

---

## Advanced Usage

### Custom Format Handler Example

Here's a complete example of implementing a TOML format handler:

```javascript
/**
 * TOML Format Handler
 * Supports basic TOML parsing and syntax highlighting
 */

// Detection
FileDetector.register('toml', {
    mimeTypes: ['application/toml', 'text/toml'],
    extensions: ['toml', 'tml'],
    contentMatcher: (content) => {
        // Look for TOML-specific patterns
        const lines = content.split('\n').map(line => line.trim());
        const hasTomlPatterns = lines.some(line =>
            /^\[[^\]]+\]$/.test(line) ||           // [section]
            /^[a-zA-Z_][a-zA-Z0-9_]*\s*=/.test(line) // key = value
        );
        return hasTomlPatterns;
    },
    priority: 15
});

// Parsing and Formatting
Formatter.register('toml', {
    parse: (text) => {
        try {
            // Use TOML parser (you'd need to include a TOML library)
            const data = TOML.parse(text);
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    format: (data, options = {}) => {
        try {
            // Convert back to TOML format
            const text = TOML.stringify(data);
            return { success: true, text };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    validate: (data) => {
        const isValid = typeof data === 'object' && data !== null;
        return { valid: isValid };
    }
});

// Syntax Highlighting
Highlighter.register('toml', {
    patterns: {
        [Highlighter.TokenType.COMMENT]: /#[^\n]*/g,
        [Highlighter.TokenType.STRING]: /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/g,
        [Highlighter.TokenType.NUMBER]: /\b\d+(\.\d+)?([eE][+-]?\d+)?\b/g,
        [Highlighter.TokenType.BOOLEAN]: /\b(true|false)\b/g,
        [Highlighter.TokenType.KEY]: /^[a-zA-Z_][a-zA-Z0-9_]*(?=\s*=)/gm,
        [Highlighter.TokenType.TAG]: /^\[[^\]]+\]/gm,
        [Highlighter.TokenType.OPERATOR]: /=/g
    }
});
```

### Error Handling Best Practices

All format handlers should implement robust error handling:

```javascript
// Good error handling
Formatter.register('myformat', {
    parse: (text) => {
        try {
            // Validate input
            if (!text || typeof text !== 'string') {
                return { success: false, error: 'Invalid input: text must be a non-empty string' };
            }

            // Attempt parsing
            const data = parseMyFormat(text);

            // Validate result
            if (!isValidData(data)) {
                return { success: false, error: 'Parsed data failed validation' };
            }

            return { success: true, data };
        } catch (error) {
            // Log for debugging but don't expose internal details
            console.warn('MyFormat parsing failed:', error);
            return {
                success: false,
                error: `Parse error: ${error.message}`
            };
        }
    }
});
```

### Performance Optimization

For large files, consider implementing streaming or chunked processing:

```javascript
// Example of chunked processing for large files
Highlighter.register('largefile', {
    tokenize: (text) => {
        const tokens = [];
        const chunkSize = 10000; // Process in 10KB chunks

        for (let i = 0; i < text.length; i += chunkSize) {
            const chunk = text.slice(i, i + chunkSize);
            const chunkTokens = processChunk(chunk, i);
            tokens.push(...chunkTokens);

            // Yield control to prevent blocking
            if (i % (chunkSize * 10) === 0) {
                setTimeout(() => {}, 0);
            }
        }

        return tokens;
    }
});
```

### Integration with External Libraries

When integrating external libraries, ensure they're loaded before your format handler:

```javascript
// Check if dependency is available
if (typeof MyParserLibrary !== 'undefined') {
    Formatter.register('myformat', {
        parse: (text) => {
            try {
                const data = MyParserLibrary.parse(text);
                return { success: true, data };
            } catch (error) {
                return { success: false, error: error.message };
            }
        }
        // ... rest of handler
    });
} else {
    console.warn('MyParserLibrary not available, myformat support disabled');
}
```

---

## Event System

The extension also provides an event system for communication between components:

### Events

- `format-detected` - Fired when a format is detected
- `content-parsed` - Fired when content is successfully parsed
- `view-changed` - Fired when switching between tree/code view
- `error-occurred` - Fired when an error occurs

### Event Handling

```javascript
// Listen for format detection
document.addEventListener('format-detected', (event) => {
    console.log('Detected format:', event.detail.format);
});

// Dispatch custom events
document.dispatchEvent(new CustomEvent('custom-event', {
    detail: { data: 'value' }
}));
```

---

## Testing Format Handlers

Each format handler should include comprehensive tests:

```javascript
describe('MyFormat Handler', () => {
    beforeEach(() => {
        // Reset services
        FileDetector.clear();
        Formatter.clear();
        Highlighter.clear();

        // Load your format handler
        require('../js/formats/myformat.js');
    });

    describe('Detection', () => {
        test('detects by extension', () => {
            const result = FileDetector.detectFormat('test.myformat', '', '');
            expect(result.format).toBe('myformat');
        });

        test('detects by content pattern', () => {
            const content = 'my-format-signature\ndata';
            const result = FileDetector.detectFormat('', content, '');
            expect(result.format).toBe('myformat');
        });
    });

    describe('Formatting', () => {
        test('parses valid content', () => {
            const result = Formatter.parse('valid content', 'myformat');
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
        });

        test('handles parse errors gracefully', () => {
            const result = Formatter.parse('invalid content', 'myformat');
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('Highlighting', () => {
        test('applies syntax highlighting', () => {
            const input = 'keyword "string" 123';
            const result = Highlighter.highlight(input, 'myformat');
            expect(result).toContain('hljs-keyword');
            expect(result).toContain('hljs-string');
            expect(result).toContain('hljs-number');
        });
    });
});
```

This API documentation provides the foundation for extending the Universal File Viewer with new format support. For specific implementation examples, refer to the existing format handlers in the `js/formats/` directory.