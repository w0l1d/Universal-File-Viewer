/**
 * File type detection module
 * Handles detection of file formats through multiple strategies
 */
const FileDetector = (() => {
    const detectors = new Map();
    let customFormats = {};
    let extensionMappings = {};

    /**
     * Register a format detector
     * @param {string} format - Format identifier (e.g., 'json', 'yaml')
     * @param {Object} detector - Detector configuration
     * @param {Array<string>} detector.mimeTypes - Supported MIME types
     * @param {Array<string>} detector.extensions - File extensions
     * @param {Function} detector.contentMatcher - Function to test content
     * @param {number} detector.priority - Detection priority (higher = first)
     */
    function register(format, detector) {
        detectors.set(format, {
            mimeTypes: detector.mimeTypes || [],
            extensions: detector.extensions || [],
            contentMatcher: detector.contentMatcher || null,
            priority: detector.priority || 0
        });
    }

    /**
     * Detect file format from current page
     * @returns {string|null} Detected format or null
     */
    async function detect() {
        const contentType = document.contentType.toLowerCase();
        const url = window.location.href;
        const content = document.body?.textContent || '';
        const extension = getFileExtension(url);

        // Load custom formats and mappings from settings
        await loadCustomFormats();

        // Check extension mappings first (highest priority)
        if (extension && extensionMappings[`.${extension}`]) {
            const mappedFormat = extensionMappings[`.${extension}`];
            // If it maps to a custom format, check if that format still exists
            if (customFormats[mappedFormat] || detectors.has(mappedFormat)) {
                return mappedFormat;
            }
        }

        // Check custom formats
        for (const [formatName, config] of Object.entries(customFormats)) {
            if (extension && config.extensions.includes(`.${extension}`)) {
                return config.mapper; // Return the mapped format for processing
            }
        }

        // Sort built-in detectors by priority
        const sorted = Array.from(detectors.entries())
            .sort((a, b) => b[1].priority - a[1].priority);

        for (const [format, detector] of sorted) {
            // Check MIME type
            if (detector.mimeTypes.some(mime => contentType.includes(mime))) {
                return format;
            }

            // Check file extension
            if (extension && detector.extensions.includes(extension)) {
                return format;
            }

            // Check content pattern
            if (detector.contentMatcher && detector.contentMatcher(content)) {
                return format;
            }
        }

        return null;
    }

    /**
     * Get detector configuration for a format
     * @param {string} format - Format identifier
     * @returns {Object|null} Detector configuration
     */
    function getDetector(format) {
        return detectors.get(format) || null;
    }

    /**
     * Extract file extension from URL, handling query parameters and complex cases
     * @param {string} url - The URL to extract extension from
     * @returns {string|null} The file extension or null
     * @private
     */
    function getFileExtension(url) {
        try {
            // Parse URL to separate path from query parameters
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;

            // Get the last segment of the path
            const segments = pathname.split('/');
            const filename = segments[segments.length - 1];

            // Extract extension
            const dotIndex = filename.lastIndexOf('.');
            if (dotIndex > 0 && dotIndex < filename.length - 1) {
                return filename.substring(dotIndex + 1).toLowerCase();
            }

            // Fallback to simple extraction if URL parsing fails
            return null;
        } catch (e) {
            // Fallback for malformed URLs
            const extension = url.split('.').pop().toLowerCase().split('?')[0].split('#')[0];
            return extension.length > 0 && extension.length < 10 ? extension : null;
        }
    }

    /**
     * Load custom formats and extension mappings from settings
     * @private
     */
    async function loadCustomFormats() {
        try {
            if (typeof browser !== 'undefined' && browser.runtime) {
                const response = await browser.runtime.sendMessage({
                    action: 'getCustomFormats'
                });
                if (response) {
                    customFormats = response.customFormats || {};
                    extensionMappings = response.extensionMappings || {};
                }
            }
        } catch (error) {
            console.log('FileDetector: Could not load custom formats:', error);
            customFormats = {};
            extensionMappings = {};
        }
    }

    /**
     * Get all supported formats including custom ones
     * @returns {Array<string>} Array of format names
     */
    function getSupportedFormats() {
        const builtInFormats = Array.from(detectors.keys());
        const customFormatNames = Object.keys(customFormats);
        return [...builtInFormats, ...customFormatNames];
    }

    return {
        register,
        detect,
        getDetector,
        getSupportedFormats
    };
})();