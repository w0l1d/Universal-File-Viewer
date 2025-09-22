/**
 * Syntax highlighting module
 * Provides token-based syntax highlighting for different formats
 */
const Highlighter = (() => {
    const highlighters = new Map();

    /**
     * Token types for consistent styling
     */
    const TokenType = {
        STRING: 'string',
        NUMBER: 'number',
        BOOLEAN: 'boolean',
        NULL: 'null',
        KEY: 'key',
        KEYWORD: 'keyword',
        COMMENT: 'comment',
        OPERATOR: 'operator',
        PUNCTUATION: 'punctuation',
        VARIABLE: 'variable',
        FUNCTION: 'function',
        CLASS: 'class',
        TAG: 'tag',
        ATTRIBUTE: 'attribute',
        ERROR: 'error'
    };

    /**
     * Register a highlighter
     * @param {string} format - Format identifier
     * @param {Object} highlighter - Highlighter configuration
     * @param {Function} highlighter.tokenize - Tokenize function
     * @param {Object} highlighter.patterns - Regex patterns for tokens
     */
    function register(format, highlighter) {
        highlighters.set(format, highlighter);
    }

    /**
     * Highlight text
     * @param {string} text - Text to highlight
     * @param {string} format - Format identifier
     * @returns {string} HTML with syntax highlighting
     */
    function highlight(text, format) {
        const highlighter = highlighters.get(format);
        if (!highlighter) {
            return escapeHtml(text);
        }

        if (highlighter.tokenize) {
            return tokenBasedHighlight(text, highlighter.tokenize);
        } else if (highlighter.patterns) {
            return patternBasedHighlight(text, highlighter.patterns);
        }

        return escapeHtml(text);
    }

    /**
     * Token-based highlighting
     * @private
     */
    function tokenBasedHighlight(text, tokenize) {
        const tokens = tokenize(text);
        let html = '';
        let lastIndex = 0;

        for (const token of tokens) {
            // Add any text before this token
            if (token.start > lastIndex) {
                html += escapeHtml(text.substring(lastIndex, token.start));
            }

            // Add the token
            const tokenText = text.substring(token.start, token.end);
            html += `<span class="fv-${token.type}">${escapeHtml(tokenText)}</span>`;

            lastIndex = token.end;
        }

        // Add any remaining text
        if (lastIndex < text.length) {
            html += escapeHtml(text.substring(lastIndex));
        }

        return html;
    }

    /**
     * Pattern-based highlighting (simpler, regex-based)
     * @private
     */
    function patternBasedHighlight(text, patterns) {
        let html = escapeHtml(text);

        // Apply patterns in order
        for (const [tokenType, pattern] of Object.entries(patterns)) {
            if (pattern instanceof RegExp) {
                html = html.replace(pattern, (match, ...groups) => {
                    // If pattern has groups, highlight the first group
                    const content = groups[0] !== undefined ? groups[0] : match;
                    return match.replace(content, `<span class="fv-${tokenType}">${content}</span>`);
                });
            }
        }

        return html;
    }

    /**
     * Escape HTML special characters
     * @private
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Get available token types
     */
    function getTokenTypes() {
        return TokenType;
    }

    return {
        register,
        highlight,
        getTokenTypes,
        TokenType
    };
})();