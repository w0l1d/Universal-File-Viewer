/**
 * Main entry point for File Viewer extension
 * Orchestrates the detection, parsing, formatting, and rendering
 */
(() => {
    /**
     * Initialize the file viewer
     */
    async function init() {
        // Debug information
        console.log('File Viewer: Initializing...');
        console.log('URL:', window.location.href);
        console.log('Content-Type:', document.contentType);
        console.log('Body children count:', document.body.children.length);
        console.log('Content preview:', document.body.textContent.substring(0, 200));

        // Detect file format (now async)
        const format = await FileDetector.detect();
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

        // Get settings and continue with async processing
        await processContent(parseResult, rawContent, format);
    }

    /**
     * Process content with user settings
     * @private
     */
    async function processContent(parseResult, rawContent, format) {
        let formattedContent;
        let highlightedContent;
        let error = null;

        // Get user settings (2025 pattern - direct storage access)
        const settings = await getAllSettings();
        const { sortKeys, showLineNumbers, indentSize, theme } = settings;

        if (parseResult.success) {
            // Format the parsed data
            try {
                formattedContent = Formatter.format(parseResult.data, format, {
                    indent: indentSize,
                    sortKeys: sortKeys
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

        // Render the viewer with settings
        Viewer.render({
            format: format,
            content: highlightedContent,
            raw: rawContent,
            metadata: metadata,
            error: error,
            settings: {
                showLineNumbers: showLineNumbers,
                theme: theme,
                sortKeys: sortKeys,
                indentSize: indentSize
            }
        });

        // Apply theme
        applyTheme(theme);

        // Track usage
        trackUsage(format);
    }

    /**
     * Apply theme to the page
     * @private
     */
    function applyTheme(theme) {
        console.log('File Viewer: Applying theme:', theme);

        document.documentElement.setAttribute('data-theme', theme);

        // If theme is auto, detect system preference
        if (theme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const actualTheme = prefersDark ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', actualTheme);
            console.log('File Viewer: Auto theme resolved to:', actualTheme);
        }

        // Force update body background for immediate visual feedback
        const body = document.body;
        if (body) {
            // Apply background color based on theme
            const isDark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
            body.style.backgroundColor = isDark ? '#0d1117' : '#ffffff';
            body.style.color = isDark ? '#f0f6fc' : '#212529';
            console.log('File Viewer: Applied body styles for theme:', theme);
        }

        // Update container if it exists
        const container = document.querySelector('.fv-container');
        if (container) {
            container.setAttribute('data-theme', theme);
            console.log('File Viewer: Updated container theme');
        }
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
     * Get user settings from extension storage (2025 pattern)
     * @private
     */
    async function getAllSettings() {
        if (typeof browser !== 'undefined' && browser.storage) {
            try {
                const result = await browser.storage.local.get('settings');
                return result.settings || {
                    theme: 'auto',
                    showLineNumbers: true,
                    sortKeys: false,
                    autoFormat: true,
                    indentSize: 2
                };
            } catch (error) {
                console.warn('File Viewer: Could not access storage:', error);
            }
        }

        // Fallback to localStorage
        try {
            const stored = localStorage.getItem('fv-settings');
            return stored ? JSON.parse(stored) : {
                theme: 'auto',
                showLineNumbers: true,
                sortKeys: false,
                autoFormat: true,
                indentSize: 2
            };
        } catch {
            return {
                theme: 'auto',
                showLineNumbers: true,
                sortKeys: false,
                autoFormat: true,
                indentSize: 2
            };
        }
    }

    /**
     * Track usage statistics
     * @private
     */
    function trackUsage(format) {
        if (typeof browser !== 'undefined' && browser.runtime) {
            browser.runtime.sendMessage({
                action: 'trackUsage',
                format: format
            }).catch(() => {
                // Fallback to localStorage if extension context not available
                try {
                    const stats = JSON.parse(localStorage.getItem('fv-stats') || '{}');
                    stats[format] = (stats[format] || 0) + 1;
                    stats.lastUsed = new Date().toISOString();
                    localStorage.setItem('fv-stats', JSON.stringify(stats));
                } catch (e) {
                    // Ignore errors in statistics
                }
            });
        }
    }

    /**
     * Listen for storage changes (2025 pattern)
     * @private
     */
    function setupStorageListener() {
        if (typeof browser !== 'undefined' && browser.storage) {
            browser.storage.onChanged.addListener((changes, namespace) => {
                if (namespace === 'local' && changes.settings) {
                    console.log('File Viewer: Settings changed, applying updates...');
                    const newSettings = changes.settings.newValue;
                    if (newSettings) {
                        // Apply settings to current viewer if it exists
                        if (typeof Viewer !== 'undefined' && Viewer.updateSettings) {
                            Viewer.updateSettings(newSettings);
                        }
                        // Also apply theme immediately
                        if (newSettings.theme) {
                            applyTheme(newSettings.theme);
                        }
                    }
                }
            });
        }
    }

    /**
     * Setup message listener for popup communication
     * @private
     */
    function setupMessageListener() {
        if (typeof browser !== 'undefined' && browser.runtime) {
            browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
                console.log('File Viewer: Received message:', message);
                alert('Message received: ' + JSON.stringify(message)); // DEBUG
                if (message.action === 'settingsUpdated') {
                    alert('Settings update message received!'); // DEBUG
                    console.log('File Viewer: Settings updated via message, applying changes...');
                    // Apply settings to current viewer if it exists
                    if (typeof Viewer !== 'undefined' && Viewer.updateSettings) {
                        console.log('File Viewer: Calling Viewer.updateSettings');
                        Viewer.updateSettings(message.settings);
                    } else {
                        console.log('File Viewer: Viewer not available or updateSettings method missing');
                    }
                    // Also apply theme immediately
                    if (message.settings.theme) {
                        applyTheme(message.settings.theme);
                    }
                }
                return true; // Keep message channel open
            });
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

    // Setup storage and message listeners
    setupStorageListener();
    setupMessageListener();

    console.log('File Viewer: Message listeners setup complete');

    // Add a simple visual indicator that the content script is running
    const debugIndicator = document.createElement('div');
    debugIndicator.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: red;
        color: white;
        padding: 5px;
        z-index: 9999;
        font-size: 12px;
    `;
    debugIndicator.textContent = 'Content Script Loaded';
    document.body.appendChild(debugIndicator);

    // Remove after 3 seconds
    setTimeout(() => {
        debugIndicator.remove();
    }, 3000);

    /**
     * Force update line numbers based on setting
     * @private
     */
    function updateLineNumbers(showLineNumbers) {
        const pre = document.querySelector('.fv-content');
        const hasLineNumbers = pre?.classList.contains('fv-line-numbers');

        if (showLineNumbers && !hasLineNumbers && pre) {
            console.log('File Viewer: Adding line numbers');
            pre.classList.add('fv-line-numbers');
            const code = document.querySelector('.fv-content code');
            if (code) {
                const textContent = code.textContent || '';
                const lines = textContent.split('\n').length;
                addLineNumbersToElement(pre, lines);
            }
        } else if (!showLineNumbers && hasLineNumbers) {
            console.log('File Viewer: Removing line numbers');
            pre?.classList.remove('fv-line-numbers');
            const lineNumbersWrapper = document.querySelector('.fv-line-numbers-wrapper');
            lineNumbersWrapper?.remove();
        }
    }

    /**
     * Add line numbers to a pre element
     * @private
     */
    function addLineNumbersToElement(pre, lineCount) {
        // Remove existing line numbers
        const existing = pre.querySelector('.fv-line-numbers-wrapper');
        if (existing) existing.remove();

        const lineNumbers = document.createElement('div');
        lineNumbers.className = 'fv-line-numbers-wrapper';
        lineNumbers.style.cssText = `
            position: absolute;
            left: 0;
            top: 16px;
            width: 50px;
            background: var(--fv-bg-secondary, #f8f9fa);
            border-right: 1px solid var(--fv-border, #dee2e6);
            padding: 0 8px;
            user-select: none;
            overflow: hidden;
        `;

        for (let i = 1; i <= lineCount; i++) {
            const lineNumber = document.createElement('div');
            lineNumber.className = 'fv-line-number';
            lineNumber.textContent = i;
            lineNumber.style.cssText = `
                color: var(--fv-text-muted, #adb5bd);
                text-align: right;
                font-size: 11px;
                line-height: 1.5;
            `;
            lineNumbers.appendChild(lineNumber);
        }

        pre.appendChild(lineNumbers);
        console.log('File Viewer: Added', lineCount, 'line numbers');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', async () => {
            debugPageContext();
            if (shouldRun()) {
                await init();
                console.log('File Viewer: Initialization complete, ready for settings updates');
            }
        });
    } else {
        debugPageContext();
        if (shouldRun()) {
            init().then(() => {
                console.log('File Viewer: Initialization complete, ready for settings updates');
                // Add another debug indicator
                const initIndicator = document.createElement('div');
                initIndicator.style.cssText = `
                    position: fixed;
                    top: 50px;
                    right: 10px;
                    background: green;
                    color: white;
                    padding: 5px;
                    z-index: 9999;
                    font-size: 12px;
                `;
                initIndicator.textContent = 'File Viewer Initialized';
                document.body.appendChild(initIndicator);
                setTimeout(() => initIndicator.remove(), 3000);
            }).catch(error => {
                console.error('File Viewer: Initialization failed:', error);
            });
        }
    }

    // Export for testing
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { init };
    }
})();