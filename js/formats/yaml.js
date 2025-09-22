/**
 * YAML format handler
 * Registers YAML detection, parsing, formatting, and highlighting
 */
(() => {
    // Register detector
    FileDetector.register('yaml', {
        mimeTypes: [
            'application/x-yaml',
            'text/yaml',
            'text/x-yaml',
            'application/yaml',
            'text/plain', // S3 often serves YAML as text/plain
            'application/octet-stream' // Fallback for unknown MIME types
        ],
        extensions: ['yaml', 'yml'],
        contentMatcher: (content) => {
            const trimmed = content.trim();

            // Strong YAML indicators
            if (trimmed.startsWith('---')) return true;
            if (trimmed.startsWith('version:') || trimmed.startsWith('apiVersion:')) return true;
            if (trimmed.startsWith('spring:') || trimmed.startsWith('server:')) return true;

            // Check for YAML key-value patterns
            if (/^[a-zA-Z0-9_-]+\s*:/m.test(trimmed)) {
                // Additional checks to avoid false positives with other formats
                const lines = trimmed.split('\n').slice(0, 10); // Check first 10 lines
                const yamlLines = lines.filter(line =>
                    /^\s*[a-zA-Z0-9_-]+\s*:/.test(line) ||
                    /^\s*-\s+/.test(line) ||
                    line.trim() === '---' ||
                    line.trim() === ''
                );

                // If more than half the non-empty lines look like YAML, it's probably YAML
                const nonEmptyLines = lines.filter(line => line.trim());
                return yamlLines.length > nonEmptyLines.length * 0.5;
            }

            // List patterns
            return trimmed.includes('\n- ') || /^- /m.test(trimmed);
        },
        priority: 9 // Higher priority to catch YAML served as text/plain
    });

    // Register formatter
    Formatter.register('yaml', {
        parse: (text) => {
            // Use js-yaml library
            if (typeof jsyaml === 'undefined') {
                throw new Error('js-yaml library not loaded');
            }
            return jsyaml.load(text);
        },

        format: (data, options = {}) => {
            if (typeof jsyaml === 'undefined') {
                throw new Error('js-yaml library not loaded');
            }

            const yamlOptions = {
                indent: options.indent || 2,
                lineWidth: options.lineWidth || -1, // -1 for unlimited
                noRefs: options.noRefs !== false, // Avoid anchors by default
                sortKeys: options.sortKeys || false,
                quotingType: options.quotingType || '"', // " or '
                forceQuotes: options.forceQuotes || false
            };

            return jsyaml.dump(data, yamlOptions);
        },

        validate: (data) => {
            // Basic validation
            if (data === undefined) {
                return { valid: false, error: 'Undefined values not allowed in YAML' };
            }
            return { valid: true };
        }
    });

    // Register highlighter with more sophisticated patterns
    Highlighter.register('yaml', {
        tokenize: (text) => {
            const tokens = [];
            const lines = text.split('\n');

            lines.forEach((line, lineIndex) => {
                let offset = lines.slice(0, lineIndex).join('\n').length + (lineIndex > 0 ? 1 : 0);

                // Comments
                const commentMatch = line.match(/#.*/);
                if (commentMatch) {
                    tokens.push({
                        type: Highlighter.TokenType.COMMENT,
                        start: offset + commentMatch.index,
                        end: offset + commentMatch.index + commentMatch[0].length
                    });
                }

                // Document markers
                if (line.trim() === '---' || line.trim() === '...') {
                    tokens.push({
                        type: Highlighter.TokenType.OPERATOR,
                        start: offset + line.indexOf(line.trim()),
                        end: offset + line.indexOf(line.trim()) + line.trim().length
                    });
                    return;
                }

                // Key-value pairs
                const keyMatch = line.match(/^(\s*)([a-zA-Z0-9_-]+)(\s*:\s*)/);
                if (keyMatch) {
                    const keyStart = offset + keyMatch[1].length;
                    tokens.push({
                        type: Highlighter.TokenType.KEY,
                        start: keyStart,
                        end: keyStart + keyMatch[2].length
                    });

                    // Value after colon
                    const valueStart = offset + keyMatch[0].length;
                    const value = line.substring(keyMatch[0].length);
                    tokenizeYamlValue(value, valueStart, tokens);
                    return;
                }

                // List items
                const listMatch = line.match(/^(\s*)(-\s+)/);
                if (listMatch) {
                    tokens.push({
                        type: Highlighter.TokenType.OPERATOR,
                        start: offset + listMatch[1].length,
                        end: offset + listMatch[1].length + 1
                    });

                    const valueStart = offset + listMatch[0].length;
                    const value = line.substring(listMatch[0].length);
                    tokenizeYamlValue(value, valueStart, tokens);
                }

                // Anchors and aliases
                const anchorMatch = line.match(/[&*][a-zA-Z0-9_-]+/g);
                if (anchorMatch) {
                    anchorMatch.forEach(match => {
                        const index = line.indexOf(match);
                        tokens.push({
                            type: Highlighter.TokenType.VARIABLE,
                            start: offset + index,
                            end: offset + index + match.length
                        });
                    });
                }
            });

            return tokens;
        }
    });

    /**
     * Tokenize YAML value
     * @private
     */
    function tokenizeYamlValue(value, offset, tokens) {
        if (!value || value.trim().startsWith('#')) return;

        const trimmed = value.trim();
        const valueOffset = offset + value.indexOf(trimmed);

        // Strings (quoted)
        if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
            (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
            tokens.push({
                type: Highlighter.TokenType.STRING,
                start: valueOffset,
                end: valueOffset + trimmed.length
            });
            return;
        }

        // Numbers
        if (/^-?\d+\.?\d*([eE][+-]?\d+)?$/.test(trimmed)) {
            tokens.push({
                type: Highlighter.TokenType.NUMBER,
                start: valueOffset,
                end: valueOffset + trimmed.length
            });
            return;
        }

        // Booleans
        if (/^(true|false|yes|no|on|off)$/i.test(trimmed)) {
            tokens.push({
                type: Highlighter.TokenType.BOOLEAN,
                start: valueOffset,
                end: valueOffset + trimmed.length
            });
            return;
        }

        // Null
        if (/^(null|~)$/i.test(trimmed)) {
            tokens.push({
                type: Highlighter.TokenType.NULL,
                start: valueOffset,
                end: valueOffset + trimmed.length
            });
            return;
        }

        // Multiline indicators
        if (trimmed === '|' || trimmed === '>') {
            tokens.push({
                type: Highlighter.TokenType.OPERATOR,
                start: valueOffset,
                end: valueOffset + 1
            });
            return;
        }

        // Default to string
        if (trimmed.length > 0) {
            tokens.push({
                type: Highlighter.TokenType.STRING,
                start: valueOffset,
                end: valueOffset + trimmed.length
            });
        }
    }
})();