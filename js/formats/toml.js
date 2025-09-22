/**
 * TOML format handler
 * Supports basic TOML parsing and highlighting
 *
 * @format TOML (Tom's Obvious, Minimal Language)
 */
(() => {
    // Register detector
    FileDetector.register('toml', {
        mimeTypes: ['application/toml', 'text/toml'],
        extensions: ['toml'],
        contentMatcher: (content) => {
            const trimmed = content.trim();
            // Look for TOML patterns
            return /^\[[\w.]+\]$/m.test(trimmed) || // [section]
                /^[\w_-]+\s*=\s*.+$/m.test(trimmed); // key = value
        },
        priority: 7
    });

    // Register formatter
    Formatter.register('toml', {
        parse: (text) => {
            return parseTOML(text);
        },

        format: (data, options = {}) => {
            return formatTOML(data, options);
        },

        validate: (data) => {
            if (!data || Object.keys(data).length === 0) {
                return { valid: false, error: 'Empty TOML data' };
            }
            return { valid: true };
        }
    });

    // Register highlighter with comprehensive patterns
    Highlighter.register('toml', {
        tokenize: (text) => {
            const tokens = [];
            const lines = text.split('\n');
            let offset = 0;

            lines.forEach(line => {
                const lineStart = offset;

                // Comments
                if (line.includes('#')) {
                    const commentIndex = line.indexOf('#');
                    tokens.push({
                        type: Highlighter.TokenType.COMMENT,
                        start: lineStart + commentIndex,
                        end: lineStart + line.length
                    });
                    // Process only the part before comment
                    line = line.substring(0, commentIndex);
                }

                // Section headers [section] or [section.subsection]
                const sectionMatch = line.match(/^\s*\[([^\]]+)\]\s*$/);
                if (sectionMatch) {
                    const bracketStart = lineStart + line.indexOf('[');
                    tokens.push({
                        type: Highlighter.TokenType.OPERATOR,
                        start: bracketStart,
                        end: bracketStart + 1
                    });

                    tokens.push({
                        type: Highlighter.TokenType.CLASS,
                        start: bracketStart + 1,
                        end: bracketStart + 1 + sectionMatch[1].length
                    });

                    tokens.push({
                        type: Highlighter.TokenType.OPERATOR,
                        start: bracketStart + 1 + sectionMatch[1].length,
                        end: bracketStart + 2 + sectionMatch[1].length
                    });
                }

                // Array of tables [[table]]
                const tableArrayMatch = line.match(/^\s*\[\[([^\]]+)\]\]\s*$/);
                if (tableArrayMatch) {
                    const bracketStart = lineStart + line.indexOf('[[');
                    tokens.push({
                        type: Highlighter.TokenType.OPERATOR,
                        start: bracketStart,
                        end: bracketStart + 2
                    });

                    tokens.push({
                        type: Highlighter.TokenType.CLASS,
                        start: bracketStart + 2,
                        end: bracketStart + 2 + tableArrayMatch[1].length
                    });

                    tokens.push({
                        type: Highlighter.TokenType.OPERATOR,
                        start: bracketStart + 2 + tableArrayMatch[1].length,
                        end: bracketStart + 4 + tableArrayMatch[1].length
                    });
                }

                // Key-value pairs
                const kvMatch = line.match(/^(\s*)([\w_-]+(?:\.[\w_-]+)*)\s*(=)\s*(.*)$/);
                if (kvMatch) {
                    const [, indent, key, equals, value] = kvMatch;

                    // Key
                    tokens.push({
                        type: Highlighter.TokenType.KEY,
                        start: lineStart + indent.length,
                        end: lineStart + indent.length + key.length
                    });

                    // Equals
                    const equalsPos = lineStart + indent.length + key.length + kvMatch[0].indexOf('=', indent.length + key.length);
                    tokens.push({
                        type: Highlighter.TokenType.OPERATOR,
                        start: equalsPos,
                        end: equalsPos + 1
                    });

                    // Value
                    const valueStart = lineStart + kvMatch[0].length - value.length;
                    tokenizeTOMLValue(value, valueStart, tokens);
                }

                offset += line.length + 1; // +1 for newline
            });

            return tokens;
        }
    });

    /**
     * Parse TOML text
     * @private
     */
    function parseTOML(text) {
        const result = {};
        let currentSection = result;
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Skip empty lines and comments
            if (!line || line.startsWith('#')) continue;

            // Section header
            if (line.startsWith('[') && line.endsWith(']')) {
                const sectionPath = line.slice(1, -1).trim();
                currentSection = createSection(result, sectionPath.split('.'));
                continue;
            }

            // Key-value pair
            const kvMatch = line.match(/^([\w_-]+)\s*=\s*(.+)$/);
            if (kvMatch) {
                const [, key, value] = kvMatch;
                currentSection[key] = parseTOMLValue(value);
            }
        }

        return result;
    }

    /**
     * Format TOML data
     * @private
     */
    function formatTOML(data, options = {}) {
        const lines = [];
        const indent = ' '.repeat(options.indent || 2);

        // Format root level key-values
        Object.entries(data).forEach(([key, value]) => {
            if (typeof value === 'object' && !Array.isArray(value)) {
                // Skip sections for now
            } else {
                lines.push(`${key} = ${formatTOMLValue(value)}`);
            }
        });

        // Format sections
        Object.entries(data).forEach(([key, value]) => {
            if (typeof value === 'object' && !Array.isArray(value)) {
                if (lines.length > 0) lines.push('');
                lines.push(`[${key}]`);
                formatSection(value, lines, indent);
            }
        });

        return lines.join('\n');
    }

    /**
     * Create nested section
     * @private
     */
    function createSection(root, path) {
        let current = root;
        for (const key of path) {
            if (!current[key]) {
                current[key] = {};
            }
            current = current[key];
        }
        return current;
    }

    /**
     * Parse TOML value
     * @private
     */
    function parseTOMLValue(value) {
        value = value.trim();

        // String (quoted)
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
            return value.slice(1, -1);
        }

        // Boolean
        if (value === 'true') return true;
        if (value === 'false') return false;

        // Number
        if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(value)) {
            return parseFloat(value);
        }

        // Date/Time (basic support)
        if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
            return value; // Keep as string for simplicity
        }

        // Array
        if (value.startsWith('[') && value.endsWith(']')) {
            return value.slice(1, -1)
                .split(',')
                .map(item => parseTOMLValue(item.trim()));
        }

        // Default to string
        return value;
    }

    /**
     * Format TOML value
     * @private
     */
    function formatTOMLValue(value) {
        if (typeof value === 'string') {
            if (value.includes('\n') || value.includes('"')) {
                return `'${value}'`;
            }
            return `"${value}"`;
        }

        if (typeof value === 'boolean') {
            return value.toString();
        }

        if (typeof value === 'number') {
            return value.toString();
        }

        if (Array.isArray(value)) {
            return `[${value.map(formatTOMLValue).join(', ')}]`;
        }

        return '""';
    }

    /**
     * Format section content
     * @private
     */
    function formatSection(data, lines, indent) {
        Object.entries(data).forEach(([key, value]) => {
            if (typeof value === 'object' && !Array.isArray(value)) {
                // Nested section - handled separately
            } else {
                lines.push(`${key} = ${formatTOMLValue(value)}`);
            }
        });
    }

    /**
     * Tokenize TOML value for highlighting
     * @private
     */
    function tokenizeTOMLValue(value, offset, tokens) {
        value = value.trim();
        if (!value) return;

        // Strings
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
            tokens.push({
                type: Highlighter.TokenType.STRING,
                start: offset,
                end: offset + value.length
            });
            return;
        }

        // Multi-line strings
        if (value.startsWith('"""') || value.startsWith("'''")) {
            tokens.push({
                type: Highlighter.TokenType.STRING,
                start: offset,
                end: offset + value.length
            });
            return;
        }

        // Booleans
        if (value === 'true' || value === 'false') {
            tokens.push({
                type: Highlighter.TokenType.BOOLEAN,
                start: offset,
                end: offset + value.length
            });
            return;
        }

        // Numbers
        if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(value)) {
            tokens.push({
                type: Highlighter.TokenType.NUMBER,
                start: offset,
                end: offset + value.length
            });
            return;
        }

        // Arrays
        if (value.startsWith('[')) {
            // Simple array tokenization
            tokens.push({
                type: Highlighter.TokenType.OPERATOR,
                start: offset,
                end: offset + 1
            });

            if (value.endsWith(']')) {
                tokens.push({
                    type: Highlighter.TokenType.OPERATOR,
                    start: offset + value.length - 1,
                    end: offset + value.length
                });
            }
            return;
        }

        // Default to string
        tokens.push({
            type: Highlighter.TokenType.STRING,
            start: offset,
            end: offset + value.length
        });
    }
})();