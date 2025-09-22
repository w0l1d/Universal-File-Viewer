# Contributing to Universal File Viewer

Thank you for your interest in contributing to Universal File Viewer! This document provides guidelines for contributing to the project.

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- Firefox Browser
- Git

### Development Setup

1. **Fork and clone the repository**:
   ```bash
   git clone https://github.com/your-username/universal-file-viewer.git
   cd universal-file-viewer
   ```

2. **Install development dependencies**:
   ```bash
   npm install
   ```

3. **Download runtime dependencies**:
   ```bash
   npm run setup
   # or
   node setup.js
   ```

4. **Load extension in Firefox**:
   - Navigate to `about:debugging`
   - Click "This Firefox"
   - Click "Load Temporary Add-on"
   - Select `manifest.json`

## 🏗️ Project Structure

Understanding the project architecture is crucial for contributing:

```
universal-file-viewer/
├── js/
│   ├── core/                 # Core services
│   │   ├── detector.js       # File format detection
│   │   ├── formatter.js      # Data parsing and formatting
│   │   ├── highlighter.js    # Syntax highlighting
│   │   └── viewer.js         # UI rendering and interactions
│   ├── formats/              # Format-specific handlers
│   │   ├── json.js          # JSON format support
│   │   ├── yaml.js          # YAML format support
│   │   ├── xml.js           # XML format support
│   │   ├── csv.js           # CSV format support
│   │   └── toml.js          # TOML format support
│   ├── background.js         # Background service worker
│   ├── main.js              # Content script entry point
│   └── viewer-page.js       # Viewer page logic
├── lib/                     # External dependencies (downloaded by setup)
├── css/                     # Stylesheets
├── test/                    # Test files
│   └── formats/            # Format-specific tests
├── dist/                    # Built extension packages
└── docs/                    # Documentation
```

## 🔧 Development Workflow

### Making Changes

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the coding standards below

3. **Test your changes**:
   ```bash
   npm test
   npm run lint
   ```

4. **Build and test the extension**:
   ```bash
   npm run build
   # Load the built extension in Firefox and test manually
   ```

5. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add support for new format"
   ```

6. **Push and create a pull request**:
   ```bash
   git push origin feature/your-feature-name
   ```

### Commit Message Convention

We follow conventional commits:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:
- `feat: add CSV table view`
- `fix: resolve tree view expand/collapse issue`
- `docs: update API documentation`

## 🎯 Adding New File Format Support

Adding support for a new file format involves creating a format handler that registers with the three core services:

### 1. Create Format Handler

Create a new file in `js/formats/yourformat.js`:

```javascript
/**
 * YourFormat format handler
 * Provides detection, parsing, formatting, and highlighting for YourFormat files
 */

// Register with FileDetector
FileDetector.register('yourformat', {
    mimeTypes: ['application/yourformat', 'text/yourformat'],
    extensions: ['yf', 'yourformat'],
    contentMatcher: (content) => {
        // Return true if content matches your format
        return content.trim().startsWith('your-format-signature');
    },
    priority: 10 // Higher numbers checked first
});

// Register with Formatter
Formatter.register('yourformat', {
    parse: (text) => {
        try {
            // Parse your format into a JavaScript object
            const parsed = parseYourFormat(text);
            return { success: true, data: parsed };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    format: (data, options = {}) => {
        try {
            // Format data back to your format string
            const formatted = formatYourFormat(data, options);
            return { success: true, text: formatted };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    validate: (data) => {
        // Optional: validate parsed data
        return { valid: true };
    }
});

// Register with Highlighter (choose one approach)

// Option 1: Pattern-based highlighting (simple)
Highlighter.register('yourformat', {
    patterns: {
        [Highlighter.TokenType.STRING]: /"([^"\\]|\\.)*"/g,
        [Highlighter.TokenType.NUMBER]: /\b\d+(\.\d+)?\b/g,
        [Highlighter.TokenType.KEYWORD]: /\b(keyword1|keyword2)\b/g,
        [Highlighter.TokenType.COMMENT]: /#[^\n]*/g
    }
});

// Option 2: Token-based highlighting (precise)
Highlighter.register('yourformat', {
    tokenize: (text) => {
        const tokens = [];
        // Implement precise tokenization
        // Return array of {type, start, end, text} objects
        return tokens;
    }
});

// Helper functions for your format
function parseYourFormat(text) {
    // Implement parsing logic
}

function formatYourFormat(data, options) {
    // Implement formatting logic
}
```

### 2. Add to Manifest

Update `manifest.json` to include your format handler:

```json
{
  "content_scripts": [{
    "js": [
      "js/core/detector.js",
      "js/core/formatter.js",
      "js/core/highlighter.js",
      "js/core/viewer.js",
      "js/formats/json.js",
      "js/formats/yaml.js",
      "js/formats/xml.js",
      "js/formats/csv.js",
      "js/formats/toml.js",
      "js/formats/yourformat.js",
      "js/main.js"
    ]
  }]
}
```

### 3. Create Tests

Create test file `test/formats/yourformat.test.js`:

```javascript
/**
 * Tests for YourFormat format handler
 */

describe('YourFormat Format Handler', () => {
    let detector, formatter, highlighter;

    beforeEach(() => {
        // Setup test environment
        detector = require('../../js/core/detector.js');
        formatter = require('../../js/core/formatter.js');
        highlighter = require('../../js/core/highlighter.js');
        require('../../js/formats/yourformat.js');
    });

    describe('Detection', () => {
        test('detects yourformat files by extension', () => {
            const result = detector.detectFormat('test.yf', '', '');
            expect(result.format).toBe('yourformat');
        });

        test('detects yourformat files by content', () => {
            const content = 'your-format-signature\ndata: value';
            const result = detector.detectFormat('', content, '');
            expect(result.format).toBe('yourformat');
        });
    });

    describe('Formatting', () => {
        test('parses valid yourformat', () => {
            const input = 'valid yourformat content';
            const result = formatter.parse(input, 'yourformat');
            expect(result.success).toBe(true);
        });

        test('handles invalid yourformat', () => {
            const input = 'invalid content';
            const result = formatter.parse(input, 'yourformat');
            expect(result.success).toBe(false);
        });

        test('formats data back to yourformat', () => {
            const data = { key: 'value' };
            const result = formatter.format(data, 'yourformat');
            expect(result.success).toBe(true);
        });
    });

    describe('Highlighting', () => {
        test('applies syntax highlighting', () => {
            const input = 'your format content with keywords';
            const result = highlighter.highlight(input, 'yourformat');
            expect(result).toContain('hljs-keyword');
        });
    });
});
```

### 4. Update Documentation

- Add your format to the README.md supported formats list
- Document any special features or configuration options
- Add examples of your format to the documentation

## 🧪 Testing Guidelines

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test test/formats/yourformat.test.js

# Run tests in watch mode during development
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Structure

Tests should cover:
- **Detection**: File extension and content-based detection
- **Parsing**: Valid and invalid input handling
- **Formatting**: Data to text conversion
- **Highlighting**: Syntax highlighting application
- **Error Handling**: Graceful failure scenarios

### Manual Testing

Always test your changes manually in Firefox:
1. Load test files of your format
2. Verify tree view functionality (if applicable)
3. Test toggle between tree and code views
4. Check copy/download functionality
5. Verify error handling with malformed files

## 📏 Code Style Guidelines

### JavaScript Style

- **ES6+ Features**: Use modern JavaScript features
- **Async/Await**: Prefer async/await over promises when possible
- **Error Handling**: Always handle errors gracefully
- **Comments**: Document complex logic and public APIs
- **Naming**: Use descriptive variable and function names

```javascript
// Good
async function parseYamlContent(text) {
    try {
        const parsed = jsyaml.load(text);
        return { success: true, data: parsed };
    } catch (error) {
        console.warn('YAML parsing failed:', error.message);
        return { success: false, error: error.message };
    }
}

// Avoid
function parse(t) {
    return jsyaml.load(t);
}
```

### CSS Style

- **BEM Methodology**: Use Block-Element-Modifier naming
- **Mobile-First**: Write responsive CSS
- **CSS Variables**: Use custom properties for theming
- **Consistent Spacing**: Use consistent units (rem/em)

### HTML Structure

- **Semantic HTML**: Use appropriate HTML5 elements
- **Accessibility**: Include ARIA labels and proper focus management
- **Performance**: Minimize DOM manipulation

## 🔒 Security Guidelines

- **No Eval**: Never use `eval()` or similar dynamic code execution
- **Input Validation**: Validate all user inputs and file content
- **CSP Compliance**: Ensure code works with Content Security Policy
- **Permissions**: Request minimal necessary permissions in manifest

## 📋 Pull Request Guidelines

### Before Submitting

- [ ] Tests pass (`npm test`)
- [ ] Code lints successfully (`npm run lint`)
- [ ] Extension builds without errors (`npm run build`)
- [ ] Manual testing completed
- [ ] Documentation updated (if needed)
- [ ] Commit messages follow convention

### PR Description

Include in your pull request:
- **What**: Brief description of changes
- **Why**: Reason for the changes
- **How**: Technical approach used
- **Testing**: How you tested the changes
- **Screenshots**: If UI changes are involved

### Review Process

1. **Automated Checks**: GitHub Actions will run tests and linting
2. **Code Review**: Maintainers will review your code
3. **Testing**: Changes will be tested in multiple environments
4. **Approval**: Once approved, changes will be merged

## 🐛 Reporting Issues

### Bug Reports

When reporting bugs, please include:
- **Firefox Version**: Which version of Firefox
- **Extension Version**: Which version of the extension
- **File Type**: What type of file caused the issue
- **Steps to Reproduce**: Detailed steps to reproduce the bug
- **Expected vs Actual**: What you expected vs what happened
- **Screenshots/Logs**: Any relevant screenshots or console logs

### Feature Requests

For feature requests, please describe:
- **Use Case**: Why you need this feature
- **Proposed Solution**: How you think it should work
- **Alternatives**: Any alternative solutions you've considered
- **Examples**: Examples from other tools if applicable

## 🏆 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- GitHub contributor statistics

## 📞 Getting Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Code Review**: For technical guidance during development

## 📄 License

By contributing to Universal File Viewer, you agree that your contributions will be licensed under the MIT License.