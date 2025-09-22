/**
 * Format handler template
 * Copy this file and modify for your format
 *
 * @format {FORMAT_NAME}
 * @author Your Name
 */
(() => {
    const FORMAT_ID = 'myformat'; // Unique identifier for your format

    // STEP 1: Register detector
    // This determines when your formatter should be used
    FileDetector.register(FORMAT_ID, {
        // MIME types that identify this format
        mimeTypes: [
            'application/x-myformat',
            'text/myformat'
        ],

        // File extensions (without the dot)
        extensions: ['myf', 'myformat'],

        // Content matcher - return true if content matches your format
        // This is called as a fallback when MIME type and extension don't match
        contentMatcher: (content) => {
            // Example: Check if content starts with specific marker
            return content.trim().startsWith('MYFORMAT:');
        },

        // Priority (0-100) - higher priority formats are checked first
        // JSON: 10, YAML: 8, XML: 7, CSV: 6
        priority: 5
    });

    // STEP 2: Register formatter
    // This handles parsing and formatting your data
    Formatter.register(FORMAT_ID, {
        /**
         * Parse raw text into data structure
         * @param {string} text - Raw file content
         * @returns {any} Parsed data structure
         * @throws {Error} If parsing fails
         */
        parse: (text) => {
            // Example implementation
            const lines = text.split('\n');
            const data = {};

            lines.forEach(line => {
                if (line.includes('=')) {
                    const [key, value] = line.split('=');
                    data[key.trim()] = value.trim();
                }
            });

            return data;
        },

        /**
         * Format data structure back to text
         * @param {any} data - Data structure
         * @param {Object} options - Formatting options
         * @returns {string} Formatted text
         */
        format: (data, options = {}) => {
            const indent = options.indent || 2;
            const sorted = options.sortKeys || false;

            let keys = Object.keys(data);
            if (sorted) {
                keys = keys.sort();
            }

            return keys.map(key => `${key} = ${data[key]}`).join('\n');
        },

        /**
         * Optional: Validate parsed data
         * @param {any} data - Parsed data
         * @returns {Object} {valid: boolean, error?: string}
         */
        validate: (data) => {
            if (!data || Object.keys(data).length === 0) {
                return { valid: false, error: 'Empty data' };
            }

            // Add your validation rules
            return { valid: true };
        }
    });

    // STEP 3: Register highlighter
    // Choose between pattern-based or token-based highlighting

    // Option A: Pattern-based (simpler, regex-based)
    Highlighter.register(FORMAT_ID, {
        patterns: {
            // Use Highlighter.TokenType constants for consistent theming
            [Highlighter.TokenType.KEY]: /^([a-zA-Z_]\w*)\s*=/gm,
            [Highlighter.TokenType.STRING]: /"([^"]*)"/g,
            [Highlighter.TokenType.NUMBER]: /\b(\d+\.?\d*)\b/g,
            [Highlighter.TokenType.COMMENT]: /(#.*$)/gm,
            [Highlighter.TokenType.OPERATOR]: /=/g
        }
    });

    // Option B: Token-based (more complex but precise)
    /*
    Highlighter.register(FORMAT_ID, {
      tokenize: (text) => {
        const tokens = [];

        // Parse text and generate tokens
        // Each token should have: {type, start, end}

        const lines = text.split('\n');
        let offset = 0;

        lines.forEach(line => {
          // Example: tokenize key=value pairs
          const match = line.match(/^(\s*)(\w+)(\s*=\s*)(.*)$/);
          if (match) {
            const [, indent, key, equals, value] = match;

            // Key token
            tokens.push({
              type: Highlighter.TokenType.KEY,
              start: offset + indent.length,
              end: offset + indent.length + key.length
            });

            // Operator token
            tokens.push({
              type: Highlighter.TokenType.OPERATOR,
              start: offset + indent.length + key.length + equals.indexOf('='),
              end: offset + indent.length + key.length + equals.indexOf('=') + 1
            });

            // Value token
            const valueStart = offset + match[0].length - value.length;
            if (/^\d+$/.test(value)) {
              tokens.push({
                type: Highlighter.TokenType.NUMBER,
                start: valueStart,
                end: valueStart + value.length
              });
            } else {
              tokens.push({
                type: Highlighter.TokenType.STRING,
                start: valueStart,
                end: valueStart + value.length
              });
            }
          }

          offset += line.length + 1; // +1 for newline
        });

        return tokens;
      }
    });
    */

    // OPTIONAL: Custom rendering
    // If your format needs special rendering (like CSV tables), override highlight
    /*
    Highlighter.register(FORMAT_ID, {
      highlight: (text, format) => {
        // Return custom HTML
        return `<div class="custom-render">${text}</div>`;
      }
    });
    */

    // OPTIONAL: Export for testing
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { FORMAT_ID };
    }
})();