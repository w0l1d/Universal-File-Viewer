# Project Structure

This document outlines the complete structure of the Universal File Viewer Firefox extension project.

## Repository Structure

```
universal-file-viewer/
├── .github/                          # GitHub configuration
│   ├── ISSUE_TEMPLATE.md            # Issue reporting template
│   └── PULL_REQUEST_TEMPLATE.md     # Pull request template
├── .gitignore                       # Git ignore patterns
├── .idea/                           # IntelliJ IDEA configuration (gitignored)
├── CHANGELOG.md                     # Version history and release notes
├── CLAUDE.md                        # Claude Code assistant instructions
├── CONTRIBUTING.md                  # Contribution guidelines
├── LICENSE                          # MIT license
├── README.md                        # Main project documentation
├── css/                             # Stylesheets
│   └── viewer.css                   # Main viewer styles
├── dist/                            # Built extension packages (gitignored)
├── docs/                            # Documentation
│   ├── API.md                       # API documentation
│   └── PROJECT_STRUCTURE.md         # This file
├── jest.config.js                   # Jest testing configuration
├── js/                              # JavaScript source code
│   ├── background.js                # Background service worker
│   ├── core/                        # Core services
│   │   ├── detector.js              # File format detection service
│   │   ├── formatter.js             # Data parsing and formatting service
│   │   ├── highlighter.js           # Syntax highlighting service
│   │   └── viewer.js                # UI rendering and interactions
│   ├── formats/                     # Format-specific handlers
│   │   ├── csv.js                   # CSV format handler
│   │   ├── json.js                  # JSON format handler
│   │   ├── toml.js                  # TOML format handler
│   │   ├── xml.js                   # XML format handler
│   │   └── yaml.js                  # YAML format handler
│   ├── main.js                      # Content script entry point
│   └── viewer-page.js               # Viewer page logic
├── lib/                             # External libraries (auto-downloaded)
│   ├── highlight.min.css            # Highlight.js CSS theme
│   ├── highlight.min.js             # Highlight.js syntax highlighting
│   ├── js-yaml.min.js              # YAML parsing library
│   └── json-viewer.bundle.js        # JSON Viewer Web Component
├── manifest.json                    # Firefox extension manifest
├── node_modules/                    # NPM dependencies (gitignored)
├── package-lock.json                # NPM dependency lock file
├── package.json                     # NPM package configuration
├── popup.html                       # Extension popup HTML
├── popup.js                         # Extension popup JavaScript
├── setup.js                         # Dependency download script
├── test/                            # Test files
│   └── formats/                     # Format-specific tests
│       ├── csv.test.js              # CSV format tests
│       ├── json.test.js             # JSON format tests
│       ├── toml.test.js             # TOML format tests
│       ├── xml.test.js              # XML format tests
│       └── yaml.test.js             # YAML format tests
├── viewer.html                      # Main viewer page HTML
└── web-ext-artifacts/               # Web-ext build artifacts (gitignored)
```

## Core Architecture

### Service Layer (`js/core/`)

The extension uses a service-oriented architecture with four main services:

1. **FileDetector** (`detector.js`)
   - Determines file format using MIME types, extensions, and content patterns
   - Priority-based detection system
   - Extensible registration system for new formats

2. **Formatter** (`formatter.js`)
   - Parses text content into structured data
   - Formats structured data back to text
   - Validation and error handling

3. **Highlighter** (`highlighter.js`)
   - Applies syntax highlighting using pattern-based or token-based approaches
   - Integration with Highlight.js for professional highlighting
   - Support for custom token types

4. **Viewer** (`viewer.js`)
   - Renders the user interface
   - Handles user interactions
   - Manages view state (tree vs code view)

### Format Handlers (`js/formats/`)

Each supported file format has its own handler that registers with the core services:

- **JSON** - Full JSON support with tree view and syntax highlighting
- **YAML** - Complete YAML 1.2 support with tree view
- **XML** - XML parsing and syntax highlighting
- **CSV** - Comma-separated values with table formatting
- **TOML** - Tom's Obvious Minimal Language support

### Entry Points

- **`js/main.js`** - Content script that initializes the extension on supported pages
- **`js/background.js`** - Background service worker for request interception
- **`js/viewer-page.js`** - Logic for the viewer page UI and interactions

## Dependencies

### Runtime Dependencies (Auto-downloaded by `setup.js`)

- **js-yaml** (4.1.0) - YAML parsing and formatting
- **Highlight.js** (11.11.1) - Professional syntax highlighting
- **JSON Viewer Web Component** (2.1.0) - Interactive tree view

### Development Dependencies (NPM)

- **web-ext** - Firefox extension development and testing tools
- **jest** - JavaScript testing framework
- **eslint** - Code linting and style checking

## Build System

### NPM Scripts

```json
{
  "setup": "node setup.js",
  "start": "web-ext run",
  "build": "web-ext build",
  "lint": "web-ext lint && eslint js/**/*.js",
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage"
}
```

### Alternative Make Commands

- `make setup` - Download dependencies
- `make run` - Start Firefox with extension
- `make build` - Create development build
- `make production` - Create minified production build
- `make lint` - Lint the extension
- `make test` - Run tests
- `make watch` - Watch files and rebuild on changes

## File Naming Conventions

### JavaScript Files
- **Core services**: `servicename.js` (e.g., `detector.js`, `formatter.js`)
- **Format handlers**: `formatname.js` (e.g., `json.js`, `yaml.js`)
- **Tests**: `formatname.test.js` (e.g., `json.test.js`)

### Documentation
- **Main docs**: `UPPERCASE.md` (e.g., `README.md`, `CONTRIBUTING.md`)
- **Technical docs**: `docs/TITLE.md` (e.g., `docs/API.md`)

### Configuration
- **Build configs**: `toolname.config.js` (e.g., `jest.config.js`)
- **Package files**: Standard names (`package.json`, `manifest.json`)

## Testing Structure

### Test Organization
```
test/
└── formats/           # Format-specific tests
    ├── json.test.js   # JSON format tests
    ├── yaml.test.js   # YAML format tests
    └── ...            # Other format tests
```

### Test Coverage Areas
- **Detection**: File extension and content-based detection
- **Parsing**: Valid and invalid input handling
- **Formatting**: Data to text conversion
- **Highlighting**: Syntax highlighting application
- **Error Handling**: Graceful failure scenarios

## Development Workflow

### Adding New Format Support

1. **Create format handler** in `js/formats/newformat.js`
2. **Register with services** (FileDetector, Formatter, Highlighter)
3. **Add to manifest** in content_scripts array
4. **Create tests** in `test/formats/newformat.test.js`
5. **Update documentation** (README.md, API.md)

### Development Setup

1. Clone repository
2. Run `npm install` (development dependencies)
3. Run `npm run setup` (runtime dependencies)
4. Load extension in Firefox via `about:debugging`

### Release Process

1. Update version in `manifest.json`
2. Update `CHANGELOG.md`
3. Run tests: `npm test`
4. Build extension: `npm run build`
5. Create GitHub release
6. Tag release: `git tag vX.X.X`

## GitHub Integration

### Templates
- **Issue template** (`.github/ISSUE_TEMPLATE.md`) - Structured bug reports and feature requests
- **PR template** (`.github/PULL_REQUEST_TEMPLATE.md`) - Comprehensive pull request documentation

### Documentation
- **README.md** - Main project documentation with quick start guide
- **CONTRIBUTING.md** - Development guidelines and contribution process
- **CHANGELOG.md** - Version history and release notes
- **LICENSE** - MIT license text

### Automation Ready
The repository structure supports:
- GitHub Actions for CI/CD
- Automated testing on pull requests
- Release automation
- Dependency security scanning
- Code quality checks

## Security Considerations

### Content Security Policy (CSP)
- No `eval()` usage
- No inline scripts in HTML
- External libraries loaded from local files only

### Permissions
- Minimal required permissions in manifest
- No sensitive data access
- Safe file content processing

### Input Validation
- All user inputs validated
- File content sanitized before processing
- Error handling prevents information leakage

This structure provides a solid foundation for open-source development, community contributions, and professional maintenance of the Universal File Viewer extension.