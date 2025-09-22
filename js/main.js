/**
 * Main entry point for File Viewer extension
 * Orchestrates the detection, parsing, formatting, and rendering
 */
(() => {
    /**
     * Initialize the file viewer
     */
    function init() {
        // Debug information
        console.log('File Viewer: Initializing...');
        console.log('URL:', window.location.href);
        console.log('Content-Type:', document.contentType);
        console.log('Body children count:', document.body.children.length);
        console.log('Content preview:', document.body.textContent.substring(0, 200));

        // Detect file format
        const format = FileDetector.detect();
        if (!format) {
            console.log('File Viewer: No supported format detected');
            // Log detection attempts for debugging
            const url = window.location.href;
            const content = document.body?.textContent || '';
            console.log('Detection debug:');
            console.log('- URL extension:', getFileExtensionFromUrl(url));
            console.log('- Content-Type:', document.contentType.toLowerCase());
            console.log('- YAML content matcher:', testYamlContent(content));
            return;
        }

        console.log(`File Viewer: Detected ${format} format`);

        // Check if formatter is available
        if (!Formatter.hasFormatter(format)) {
            console.error(`File Viewer: No formatter available for ${format}`);
            return;
        }

        // Get raw content
        const rawContent = document.body.textContent;
        if (!rawContent.trim()) {
            console.log('File Viewer: Empty content');
            return;
        }

        // Parse content
        const parseResult = Formatter.parse(rawContent, format);

        let formattedContent;
        let highlightedContent;
        let error = null;

        if (parseResult.success) {
            // Format the parsed data
            try {
                formattedContent = Formatter.format(parseResult.data, format, {
                    indent: 2,
                    sortKeys: getSetting('sortKeys', false)
                });
            } catch (e) {
                console.error('File Viewer: Formatting error', e);
                formattedContent = rawContent;
                error = `Formatting error: ${e.message}`;
            }
        } else {
            // Keep original content if parsing failed
            formattedContent = rawContent;
            error = `Parse error: ${parseResult.error}`;
        }

        // Apply syntax highlighting
        try {
            highlightedContent = Highlighter.highlight(formattedContent, format);
        } catch (e) {
            console.error('File Viewer: Highlighting error', e);
            highlightedContent = escapeHtml(formattedContent);
        }

        // Extract metadata
        const metadata = extractMetadata(parseResult.data, format);

        // Render the viewer
        Viewer.render({
            format: format,
            content: highlightedContent,
            raw: rawContent,
            metadata: metadata,
            error: error
        });

        // Track usage
        trackUsage(format);
    }

    /**
     * Extract metadata from parsed data
     * @private
     */
    function extractMetadata(data, format) {
        if (!data) return null;

        const metadata = {};

        if (format === 'json') {
            if (Array.isArray(data)) {
                metadata.type = 'array';
                metadata.items = data.length;
            } else if (typeof data === 'object') {
                metadata.type = 'object';
                metadata.keys = Object.keys(data).length;
            }
        } else if (format === 'yaml') {
            if (Array.isArray(data)) {
                metadata.items = data.length;
            } else if (typeof data === 'object' && data !== null) {
                metadata.keys = Object.keys(data).length;
            }
        }

        return Object.keys(metadata).length > 0 ? metadata : null;
    }

    /**
     * Get user setting
     * @private
     */
    function getSetting(key, defaultValue) {
        try {
            const stored = localStorage.getItem(`fv-${key}`);
            return stored !== null ? JSON.parse(stored) : defaultValue;
        } catch {
            return defaultValue;
        }
    }

    /**
     * Track usage statistics
     * @private
     */
    function trackUsage(format) {
        try {
            const stats = JSON.parse(localStorage.getItem('fv-stats') || '{}');
            stats[format] = (stats[format] || 0) + 1;
            stats.lastUsed = new Date().toISOString();
            localStorage.setItem('fv-stats', JSON.stringify(stats));
        } catch (e) {
            // Ignore errors in statistics
        }
    }

    /**
     * Escape HTML
     * @private
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Helper function for debugging - extract file extension
     * @private
     */
    function getFileExtensionFromUrl(url) {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const segments = pathname.split('/');
            const filename = segments[segments.length - 1];
            const dotIndex = filename.lastIndexOf('.');
            if (dotIndex > 0 && dotIndex < filename.length - 1) {
                return filename.substring(dotIndex + 1).toLowerCase();
            }
            return null;
        } catch (e) {
            return null;
        }
    }

    /**
     * Helper function for debugging - test YAML content
     * @private
     */
    function testYamlContent(content) {
        const trimmed = content.trim();
        return {
            startsWithDocMarker: trimmed.startsWith('---'),
            startsWithSpring: trimmed.startsWith('spring:'),
            hasKeyValuePattern: /^[a-zA-Z0-9_-]+\s*:/m.test(trimmed),
            hasListPattern: trimmed.includes('\n- ') || /^- /m.test(trimmed)
        };
    }

    /**
     * Check if we should run on this page
     * @private
     */
    function shouldRun() {
        const content = document.body.textContent;
        if (!content || content.trim().length === 0) {
            return false;
        }

        // Check for common plain text display patterns
        const pre = document.querySelector('pre');
        const hasOnlyPre = document.body.children.length === 1 && pre;

        // Firefox often displays plain text files in a pre tag
        if (hasOnlyPre && pre.textContent === content.trim()) {
            return true;
        }

        // Some servers display plain text directly in body
        if (document.body.children.length === 0 && content.trim()) {
            return true;
        }

        // Check for minimal HTML structure (just text nodes or single elements)
        const textNodes = Array.from(document.body.childNodes).filter(node =>
            node.nodeType === Node.TEXT_NODE && node.textContent.trim()
        );

        if (textNodes.length > 0 && document.body.children.length <= 1) {
            return true;
        }

        // Additional check for content that looks structured regardless of DOM structure
        const trimmed = content.trim();
        if (trimmed.length > 50) {
            // Strong indicators this might be a structured file
            const indicators = [
                trimmed.startsWith('{'),      // JSON
                trimmed.startsWith('---'),    // YAML
                trimmed.startsWith('<?xml'),  // XML
                /^[a-zA-Z0-9_-]+\s*:/m.test(trimmed), // YAML/Config
                trimmed.startsWith('spring:'), // Spring config
                trimmed.startsWith('apiVersion:') // Kubernetes YAML
            ];

            if (indicators.some(test => test)) {
                return true;
            }
        }

        return false;
    }

    // Debug function to understand current page context
    function debugPageContext() {
        console.log('File Viewer Debug:');
        console.log('- URL:', window.location.href);
        console.log('- Document ready state:', document.readyState);
        console.log('- Document content type:', document.contentType);
        console.log('- Body children count:', document.body?.children.length || 0);
        console.log('- Has pre element:', !!document.querySelector('pre'));
        console.log('- Body text length:', document.body?.textContent?.length || 0);
        console.log('- Should run:', shouldRun());
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            debugPageContext();
            if (shouldRun()) init();
        });
    } else {
        debugPageContext();
        if (shouldRun()) init();
    }

    // Export for testing
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { init };
    }
})();