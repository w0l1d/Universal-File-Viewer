/**
 * JSON format handler
 * Registers JSON detection, parsing, formatting, and highlighting
 */
(() => {
    // Register detector
    FileDetector.register('json', {
        mimeTypes: ['application/json', 'text/json', 'application/ld+json'],
        extensions: ['json', 'jsonld', 'json5', 'geojson'],
        contentMatcher: (content) => {
            const trimmed = content.trim();
            // Check for JSON-like structure
            return (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
                (trimmed.startsWith('[') && trimmed.endsWith(']'));
        },
        priority: 10
    });

    // Register formatter
    Formatter.register('json', {
        parse: (text) => {
            // Support JSON5 if needed (relaxed JSON)
            if (text.includes('//') || text.includes('/*') || /['"]\s*:\s*[^"'\s]/.test(text)) {
                // Basic JSON5 support - remove comments
                text = text
                    .replace(/\/\/.*$/gm, '') // Remove single-line comments
                    .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments
            }
            return JSON.parse(text);
        },

        format: (data, options = {}) => {
            const indent = options.indent || 2;
            const sortKeys = options.sortKeys || false;

            if (sortKeys) {
                data = sortObjectKeys(data);
            }

            return JSON.stringify(data, null, indent);
        },

        validate: (data) => {
            // Optional validation rules
            if (typeof data === 'undefined') {
                return { valid: false, error: 'Undefined is not valid JSON' };
            }
            return { valid: true };
        }
    });

    // Register highlighter
    Highlighter.register('json', {
        patterns: {
            [Highlighter.TokenType.KEY]: /"([^"\\]|\\.)*"(?=\s*:)/g,
            [Highlighter.TokenType.STRING]: /"([^"\\]|\\.)*"(?!\s*:)/g,
            [Highlighter.TokenType.NUMBER]: /\b-?\d+\.?\d*([eE][+-]?\d+)?\b/g,
            [Highlighter.TokenType.BOOLEAN]: /\b(true|false)\b/g,
            [Highlighter.TokenType.NULL]: /\bnull\b/g,
            [Highlighter.TokenType.PUNCTUATION]: /[{}[\],]/g
        }
    });

    /**
     * Sort object keys recursively
     * @private
     */
    function sortObjectKeys(obj) {
        if (Array.isArray(obj)) {
            return obj.map(sortObjectKeys);
        } else if (obj !== null && typeof obj === 'object') {
            return Object.keys(obj)
                .sort()
                .reduce((sorted, key) => {
                    sorted[key] = sortObjectKeys(obj[key]);
                    return sorted;
                }, {});
        }
        return obj;
    }
})();