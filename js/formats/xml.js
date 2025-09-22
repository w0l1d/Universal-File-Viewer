/**
 * XML format handler - Example of adding a new format
 * Shows how to extend the viewer with additional file types
 */
(() => {
    // Register detector
    FileDetector.register('xml', {
        mimeTypes: ['application/xml', 'text/xml', 'application/xhtml+xml'],
        extensions: ['xml', 'xhtml', 'svg', 'rss', 'atom', 'opml'],
        contentMatcher: (content) => {
            const trimmed = content.trim();
            return trimmed.startsWith('<?xml') ||
                trimmed.startsWith('<') && trimmed.includes('>');
        },
        priority: 7
    });

    // Register formatter
    Formatter.register('xml', {
        parse: (text) => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/xml');

            // Check for parse errors
            const parseError = doc.querySelector('parsererror');
            if (parseError) {
                throw new Error(parseError.textContent);
            }

            return doc;
        },

        format: (doc, options = {}) => {
            const indent = options.indent || 2;

            // Convert DOM to formatted string
            const serializer = new XMLSerializer();
            let xml = serializer.serializeToString(doc);

            // Format with indentation
            return formatXml(xml, indent);
        },

        validate: (doc) => {
            if (doc.documentElement.nodeName === 'parsererror') {
                return { valid: false, error: 'Invalid XML structure' };
            }
            return { valid: true };
        }
    });

    // Register highlighter
    Highlighter.register('xml', {
        patterns: {
            [Highlighter.TokenType.COMMENT]: /<!--[\s\S]*?-->/g,
            [Highlighter.TokenType.TAG]: /<\/?([a-zA-Z0-9:-]+)([^>]*)>/g,
            [Highlighter.TokenType.ATTRIBUTE]: /([a-zA-Z0-9:-]+)="([^"]*)"/g,
            [Highlighter.TokenType.STRING]: /"([^"]*)"/g,
            [Highlighter.TokenType.OPERATOR]: /[<>\/=]/g
        },

        // Alternative: Use tokenizer for more precise highlighting
        tokenize: (text) => {
            const tokens = [];
            const regex = /<\/?([a-zA-Z0-9:-]+)([^>]*)>|<!--[\s\S]*?-->|([^<]+)/g;
            let match;

            while ((match = regex.exec(text)) !== null) {
                if (match[0].startsWith('<!--')) {
                    // Comment
                    tokens.push({
                        type: Highlighter.TokenType.COMMENT,
                        start: match.index,
                        end: match.index + match[0].length
                    });
                } else if (match[0].startsWith('<')) {
                    // Tag
                    const tagStart = match.index;
                    const tagEnd = match.index + match[0].length;

                    // Opening bracket
                    tokens.push({
                        type: Highlighter.TokenType.OPERATOR,
                        start: tagStart,
                        end: tagStart + 1
                    });

                    // Tag name
                    const tagNameMatch = match[0].match(/<\/?([a-zA-Z0-9:-]+)/);
                    if (tagNameMatch) {
                        tokens.push({
                            type: Highlighter.TokenType.TAG,
                            start: tagStart + tagNameMatch.index + 1,
                            end: tagStart + tagNameMatch.index + 1 + tagNameMatch[1].length
                        });
                    }

                    // Attributes
                    const attrRegex = /([a-zA-Z0-9:-]+)="([^"]*)"/g;
                    let attrMatch;
                    while ((attrMatch = attrRegex.exec(match[0])) !== null) {
                        // Attribute name
                        tokens.push({
                            type: Highlighter.TokenType.ATTRIBUTE,
                            start: tagStart + attrMatch.index,
                            end: tagStart + attrMatch.index + attrMatch[1].length
                        });

                        // Attribute value
                        const valueStart = tagStart + attrMatch.index + attrMatch[1].length + 2;
                        tokens.push({
                            type: Highlighter.TokenType.STRING,
                            start: valueStart,
                            end: valueStart + attrMatch[2].length
                        });
                    }

                    // Closing bracket
                    tokens.push({
                        type: Highlighter.TokenType.OPERATOR,
                        start: tagEnd - 1,
                        end: tagEnd
                    });
                }
            }

            return tokens;
        }
    });

    /**
     * Format XML with proper indentation
     * @private
     */
    function formatXml(xml, indent = 2) {
        const PADDING = ' '.repeat(indent);
        const reg = /(>)(<)(\/*)/g;
        let pad = 0;

        xml = xml.replace(reg, '$1\n$2$3');

        return xml.split('\n').map(line => {
            let indentLevel = 0;
            if (line.match(/.+<\/\w[^>]*>$/)) {
                indentLevel = 0;
            } else if (line.match(/^<\/\w/) && pad > 0) {
                pad -= 1;
            } else if (line.match(/^<\w[^>]*[^\/]>.*$/)) {
                indentLevel = 1;
            } else {
                indentLevel = 0;
            }

            const padding = PADDING.repeat(pad);
            pad += indentLevel;

            return padding + line.trim();
        }).join('\n');
    }
})();