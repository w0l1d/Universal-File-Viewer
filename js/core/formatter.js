/**
 * Format handler module
 * Manages parsing and formatting for different file types
 */
const Formatter = (() => {
    const formatters = new Map();

    /**
     * Register a format handler
     * @param {string} format - Format identifier
     * @param {Object} handler - Handler configuration
     * @param {Function} handler.parse - Parse raw text to data structure
     * @param {Function} handler.format - Format data structure to text
     * @param {Function} handler.validate - Optional validation function
     */
    function register(format, handler) {
        if (!handler.parse || !handler.format) {
            throw new Error(`Format handler for ${format} must have parse and format methods`);
        }

        formatters.set(format, {
            parse: handler.parse,
            format: handler.format,
            validate: handler.validate || null
        });
    }

    /**
     * Parse content
     * @param {string} text - Raw text content
     * @param {string} format - Format identifier
     * @returns {Object} Result with {success, data, error}
     */
    function parse(text, format) {
        const formatter = formatters.get(format);
        if (!formatter) {
            return {
                success: false,
                error: `No formatter registered for ${format}`
            };
        }

        try {
            const data = formatter.parse(text);

            // Run validation if available
            if (formatter.validate) {
                const validation = formatter.validate(data);
                if (!validation.valid) {
                    return {
                        success: false,
                        data: data,
                        error: validation.error || 'Validation failed'
                    };
                }
            }

            return {
                success: true,
                data: data,
                error: null
            };
        } catch (e) {
            return {
                success: false,
                data: null,
                error: e.message
            };
        }
    }

    /**
     * Format data structure to text
     * @param {any} data - Data structure
     * @param {string} format - Format identifier
     * @param {Object} options - Format options
     * @returns {string} Formatted text
     */
    function format(data, format, options = {}) {
        const formatter = formatters.get(format);
        if (!formatter) {
            throw new Error(`No formatter registered for ${format}`);
        }

        return formatter.format(data, options);
    }

    /**
     * Check if formatter exists
     * @param {string} format - Format identifier
     * @returns {boolean}
     */
    function hasFormatter(format) {
        return formatters.has(format);
    }

    return {
        register,
        parse,
        format,
        hasFormatter
    };
})();