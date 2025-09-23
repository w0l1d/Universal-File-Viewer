/**
 * Viewer UI module
 * Handles rendering and user interactions
 */
const Viewer = (() => {
    let currentView = 'formatted';
    let rawContent = '';
    let formattedContent = '';
    let currentFormat = '';

    /**
     * Render the viewer UI
     * @param {Object} config - Viewer configuration
     * @param {string} config.format - File format
     * @param {string} config.content - Highlighted content HTML
     * @param {string} config.raw - Raw content
     * @param {Object} config.metadata - Additional metadata
     * @param {string} config.error - Error message if any
     * @param {Object} config.settings - User settings
     */
    function render(config) {
        rawContent = config.raw;
        formattedContent = config.content;
        currentFormat = config.format;

        // Inject theme CSS if not already present
        injectThemeCSS();

        // Apply theme to document
        applyTheme(config.settings?.theme || 'auto');

        const container = createContainer();
        const header = createHeader(config);
        const content = createContent(config);
        const statusBar = createStatusBar(config);

        container.appendChild(header);

        if (config.error) {
            container.appendChild(createErrorBar(config.error));
        }

        container.appendChild(content);
        container.appendChild(statusBar);

        // Replace body content
        document.body.innerHTML = '';
        document.body.appendChild(container);

        // Ensure proper scrolling and layout
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.body.style.overflow = 'hidden';

        attachEventHandlers();

        // Add resize handler to maintain layout
        window.addEventListener('resize', handleResize);
    }

    /**
     * Create main container
     * @private
     */
    function createContainer() {
        const container = document.createElement('div');
        container.className = 'fv-container';
        container.dataset.theme = getTheme();
        return container;
    }

    /**
     * Create header with controls
     * @private
     */
    function createHeader(config) {
        const header = document.createElement('div');
        header.className = 'fv-header';

        const headerLeft = document.createElement('div');
        headerLeft.className = 'fv-header-left';

        const formatBadge = document.createElement('span');
        formatBadge.className = 'fv-format-badge';
        formatBadge.textContent = config.format.toUpperCase();

        const filename = document.createElement('span');
        filename.className = 'fv-filename';
        filename.textContent = getFilename();

        headerLeft.appendChild(formatBadge);
        headerLeft.appendChild(filename);

        const headerControls = document.createElement('div');
        headerControls.className = 'fv-header-controls';

        const buttons = [
            { action: 'toggle-view', icon: '👁', text: 'Raw', title: 'Toggle view', className: 'fv-btn-view' },
            { action: 'copy', icon: '📋', text: 'Copy', title: 'Copy to clipboard', className: 'fv-btn-copy' },
            { action: 'download', icon: '💾', text: 'Download', title: 'Download formatted', className: 'fv-btn-download' },
            { action: 'toggle-theme', icon: '🎨', text: '', title: 'Toggle theme', className: 'fv-btn-theme' }
        ];

        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.className = `fv-btn ${btn.className}`;
            button.dataset.action = btn.action;
            button.title = btn.title;

            const icon = document.createElement('span');
            icon.className = 'fv-icon';
            icon.textContent = btn.icon;
            button.appendChild(icon);

            if (btn.text) {
                const text = document.createElement('span');
                text.className = 'fv-btn-text';
                text.textContent = btn.text;
                button.appendChild(text);
            }

            headerControls.appendChild(button);
        });

        header.appendChild(headerLeft);
        header.appendChild(headerControls);

        return header;
    }

    /**
     * Create content area
     * @private
     */
    function createContent(config) {
        const wrapper = document.createElement('div');
        wrapper.className = 'fv-content-wrapper';

        const pre = document.createElement('pre');
        pre.className = 'fv-content';

        const code = document.createElement('code');
        // Note: innerHTML is required here for syntax highlighting
        // config.content comes from our own Highlighter module and is sanitized
        code.innerHTML = config.content;
        code.className = `language-${config.format}`;

        // Add line numbers based on settings
        if (config.settings?.showLineNumbers !== false) {
            pre.classList.add('fv-line-numbers');
            addLineNumbers(pre, config.content);
        }

        pre.appendChild(code);
        wrapper.appendChild(pre);

        return wrapper;
    }

    /**
     * Create status bar
     * @private
     */
    function createStatusBar(config) {
        const statusBar = document.createElement('div');
        statusBar.className = 'fv-status-bar';

        const lines = (config.raw.match(/\n/g) || []).length + 1;
        const size = new Blob([config.raw]).size;

        const linesSpan = document.createElement('span');
        linesSpan.className = 'fv-status-item';
        linesSpan.textContent = `Lines: ${lines.toLocaleString()}`;
        statusBar.appendChild(linesSpan);

        const sizeSpan = document.createElement('span');
        sizeSpan.className = 'fv-status-item';
        sizeSpan.textContent = `Size: ${formatFileSize(size)}`;
        statusBar.appendChild(sizeSpan);

        if (config.metadata) {
            const metadataSpan = document.createElement('span');
            metadataSpan.className = 'fv-status-item';
            metadataSpan.textContent = formatMetadata(config.metadata);
            statusBar.appendChild(metadataSpan);
        }

        return statusBar;
    }

    /**
     * Create error bar
     * @private
     */
    function createErrorBar(error) {
        const errorBar = document.createElement('div');
        errorBar.className = 'fv-error-bar';
        const errorIcon = document.createElement('span');
        errorIcon.className = 'fv-error-icon';
        errorIcon.textContent = '⚠️';

        const errorMessage = document.createElement('span');
        errorMessage.className = 'fv-error-message';
        errorMessage.textContent = error;

        errorBar.appendChild(errorIcon);
        errorBar.appendChild(errorMessage);
        return errorBar;
    }

    /**
     * Add line numbers
     * @private
     */
    function addLineNumbers(pre, content) {
        const lines = content.split('\n').length;
        const lineNumbers = document.createElement('div');
        lineNumbers.className = 'fv-line-numbers-wrapper';

        for (let i = 1; i <= lines; i++) {
            const lineNumber = document.createElement('div');
            lineNumber.className = 'fv-line-number';
            lineNumber.textContent = i;
            lineNumbers.appendChild(lineNumber);
        }

        pre.appendChild(lineNumbers);
    }

    /**
     * Attach event handlers
     * @private
     */
    function attachEventHandlers() {
        document.querySelectorAll('[data-action]').forEach(button => {
            button.addEventListener('click', handleAction);
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', handleKeyboard);
    }

    /**
     * Handle button actions
     * @private
     */
    function handleAction(event) {
        const action = event.currentTarget.dataset.action;

        switch (action) {
            case 'toggle-view':
                toggleView();
                break;
            case 'copy':
                copyToClipboard();
                break;
            case 'download':
                downloadFile();
                break;
            case 'toggle-theme':
                toggleTheme();
                break;
        }
    }

    /**
     * Handle keyboard shortcuts
     * @private
     */
    function handleKeyboard(event) {
        if (event.ctrlKey || event.metaKey) {
            switch (event.key) {
                case 'c':
                    if (window.getSelection().toString() === '') {
                        copyToClipboard();
                        event.preventDefault();
                    }
                    break;
                case 'r':
                    toggleView();
                    event.preventDefault();
                    break;
                case 's':
                    downloadFile();
                    event.preventDefault();
                    break;
            }
        }
    }

    /**
     * Toggle between formatted and raw view
     * @private
     */
    function toggleView() {
        const code = document.querySelector('.fv-content code');
        const button = document.querySelector('[data-action="toggle-view"] .fv-btn-text');

        if (currentView === 'formatted') {
            code.textContent = rawContent;
            code.innerHTML = code.innerHTML; // Preserve text as-is
            button.textContent = 'Formatted';
            currentView = 'raw';
        } else {
            code.innerHTML = formattedContent;
            button.textContent = 'Raw';
            currentView = 'formatted';
        }
    }

    /**
     * Copy content to clipboard
     * @private
     */
    function copyToClipboard() {
        const textToCopy = currentView === 'raw' ? rawContent :
            document.querySelector('.fv-content code').textContent;

        navigator.clipboard.writeText(textToCopy).then(() => {
            showToast('Copied to clipboard!');
        });
    }

    /**
     * Download formatted file
     * @private
     */
    function downloadFile() {
        const content = currentView === 'raw' ? rawContent :
            document.querySelector('.fv-content code').textContent;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `formatted_${getFilename()}`;
        a.click();

        URL.revokeObjectURL(url);
        showToast('File downloaded!');
    }

    /**
     * Toggle theme (2025 pattern with async/await)
     * @private
     */
    async function toggleTheme() {
        const currentTheme = getTheme();
        let newTheme;

        switch(currentTheme) {
            case 'light':
                newTheme = 'dark';
                break;
            case 'dark':
                newTheme = 'auto';
                break;
            default:
                newTheme = 'light';
        }

        applyTheme(newTheme);

        // Save to extension storage using 2025 async pattern
        if (typeof browser !== 'undefined' && browser.storage) {
            try {
                const result = await browser.storage.local.get('settings');
                const settings = result.settings || {};
                settings.theme = newTheme;
                await browser.storage.local.set({ settings });
                console.log('Theme saved:', newTheme);
            } catch (error) {
                console.warn('Could not save theme:', error);
            }
        }
    }

    /**
     * Get current theme
     * @private
     */
    function getTheme() {
        return document.documentElement.getAttribute('data-theme') || 'auto';
    }

    /**
     * Apply theme to document
     * @private
     */
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
    }

    /**
     * Inject theme CSS using 2025 best practices
     * @private
     */
    function injectThemeCSS() {
        if (document.getElementById('fv-theme-styles')) return;

        // 2025 pattern: Use inline styles for better performance and security
        const style = document.createElement('style');
        style.id = 'fv-theme-styles';
        style.textContent = getThemeCSS();
        document.head.appendChild(style);

        console.log('File Viewer: Theme CSS injected');
    }

    /**
     * Get theme CSS as string
     * @private
     */
    function getThemeCSS() {
        return `
            /* Universal File Viewer - Inline Theme Styles */
            :root {
                --fv-font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
                --fv-font-size: 13px;
                --fv-line-height: 1.5;
                --fv-border-radius: 6px;
                --fv-transition: all 0.2s ease;
            }

            /* Light Theme */
            [data-theme="light"], [data-theme="auto"] {
                --fv-bg-primary: #ffffff;
                --fv-bg-secondary: #f8f9fa;
                --fv-bg-tertiary: #e9ecef;
                --fv-text-primary: #212529;
                --fv-text-secondary: #6c757d;
                --fv-text-muted: #adb5bd;
                --fv-border: #dee2e6;
                --fv-accent: #0d6efd;
                --fv-syntax-string: #032f62;
                --fv-syntax-number: #005cc5;
                --fv-syntax-boolean: #d73a49;
                --fv-syntax-key: #22863a;
            }

            /* Dark Theme */
            [data-theme="dark"] {
                --fv-bg-primary: #0d1117;
                --fv-bg-secondary: #161b22;
                --fv-bg-tertiary: #21262d;
                --fv-text-primary: #f0f6fc;
                --fv-text-secondary: #8b949e;
                --fv-text-muted: #6e7681;
                --fv-border: #30363d;
                --fv-accent: #58a6ff;
                --fv-syntax-string: #a5d6ff;
                --fv-syntax-number: #79c0ff;
                --fv-syntax-boolean: #ffab70;
                --fv-syntax-key: #7ee787;
            }

            /* Auto theme - dark preference */
            @media (prefers-color-scheme: dark) {
                [data-theme="auto"] {
                    --fv-bg-primary: #0d1117;
                    --fv-bg-secondary: #161b22;
                    --fv-bg-tertiary: #21262d;
                    --fv-text-primary: #f0f6fc;
                    --fv-text-secondary: #8b949e;
                    --fv-text-muted: #6e7681;
                    --fv-border: #30363d;
                    --fv-accent: #58a6ff;
                    --fv-syntax-string: #a5d6ff;
                    --fv-syntax-number: #79c0ff;
                    --fv-syntax-boolean: #ffab70;
                    --fv-syntax-key: #7ee787;
                }
            }

            /* Base styles */
            body {
                margin: 0;
                padding: 0;
                font-family: var(--fv-font-family);
                background: var(--fv-bg-primary);
                color: var(--fv-text-primary);
                transition: var(--fv-transition);
            }

            .fv-container {
                min-height: 100vh;
                max-width: 100vw;
                display: flex;
                flex-direction: column;
                background: var(--fv-bg-primary);
                overflow-x: hidden;
            }

            .fv-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 12px 16px;
                background: var(--fv-bg-secondary);
                border-bottom: 1px solid var(--fv-border);
                position: sticky;
                top: 0;
                z-index: 100;
                flex-shrink: 0;
            }

            .fv-header-left {
                display: flex;
                align-items: center;
                gap: 12px;
                min-width: 0;
                flex: 1;
            }

            .fv-format-badge {
                background: var(--fv-accent);
                color: white;
                padding: 4px 8px;
                border-radius: var(--fv-border-radius);
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                flex-shrink: 0;
            }

            .fv-filename {
                color: var(--fv-text-secondary);
                font-weight: 500;
                font-size: 14px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .fv-header-controls {
                display: flex;
                gap: 8px;
                flex-shrink: 0;
            }

            .fv-btn {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 8px 12px;
                background: var(--fv-bg-primary);
                border: 1px solid var(--fv-border);
                border-radius: var(--fv-border-radius);
                color: var(--fv-text-primary);
                cursor: pointer;
                font-size: 12px;
                font-weight: 500;
                transition: var(--fv-transition);
                text-decoration: none;
            }

            .fv-btn:hover {
                background: var(--fv-bg-tertiary);
                transform: translateY(-1px);
            }

            .fv-content-wrapper {
                flex: 1;
                overflow: auto;
                position: relative;
                max-width: 100%;
            }

            .fv-content {
                margin: 0;
                padding: 16px;
                background: var(--fv-bg-primary);
                font-family: var(--fv-font-family);
                font-size: var(--fv-font-size);
                line-height: var(--fv-line-height);
                overflow-x: auto;
                white-space: pre;
                color: var(--fv-text-primary);
                max-width: 100%;
                box-sizing: border-box;
            }

            .fv-content.fv-line-numbers {
                padding-left: 60px;
            }

            .fv-line-numbers-wrapper {
                position: absolute;
                left: 0;
                top: 16px;
                width: 50px;
                background: var(--fv-bg-secondary);
                border-right: 1px solid var(--fv-border);
                padding: 0 8px;
                user-select: none;
                overflow: hidden;
            }

            .fv-line-number {
                color: var(--fv-text-muted);
                text-align: right;
                font-size: 11px;
                line-height: var(--fv-line-height);
            }

            .fv-status-bar {
                display: flex;
                align-items: center;
                gap: 16px;
                padding: 8px 16px;
                background: var(--fv-bg-secondary);
                border-top: 1px solid var(--fv-border);
                font-size: 11px;
                color: var(--fv-text-secondary);
                flex-shrink: 0;
                overflow-x: auto;
            }

            .fv-error-bar {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 12px 16px;
                background: #dc3545;
                color: white;
                font-size: 13px;
                font-weight: 500;
                flex-shrink: 0;
            }

            .fv-toast {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: var(--fv-bg-tertiary);
                color: var(--fv-text-primary);
                padding: 12px 16px;
                border-radius: var(--fv-border-radius);
                border: 1px solid var(--fv-border);
                font-size: 13px;
                z-index: 1000;
                opacity: 0;
                transform: translateY(20px);
                transition: var(--fv-transition);
            }

            .fv-toast-show {
                opacity: 1;
                transform: translateY(0);
            }

            /* Syntax highlighting */
            .fv-string { color: var(--fv-syntax-string); }
            .fv-number { color: var(--fv-syntax-number); }
            .fv-boolean { color: var(--fv-syntax-boolean); font-weight: 600; }
            .fv-key { color: var(--fv-syntax-key); font-weight: 600; }

            /* Responsive */
            @media (max-width: 768px) {
                .fv-header {
                    flex-direction: column;
                    gap: 12px;
                }
                .fv-btn .fv-btn-text {
                    display: none;
                }
                .fv-content.fv-line-numbers {
                    padding-left: 45px;
                }
                .fv-line-numbers-wrapper {
                    width: 35px;
                }
            }

            /* High contrast mode support (2025 accessibility) */
            @media (prefers-contrast: high) {
                .fv-container {
                    --fv-border: #000000;
                    --fv-bg-secondary: #f0f0f0;
                }
                [data-theme="dark"] .fv-container {
                    --fv-border: #ffffff;
                    --fv-bg-secondary: #1a1a1a;
                }
            }

            /* Reduced motion support (2025 accessibility) */
            @media (prefers-reduced-motion: reduce) {
                * {
                    transition: none !important;
                    animation: none !important;
                }
            }
        `;
    }

    /**
     * Get filename from URL
     * @private
     */
    function getFilename() {
        const path = window.location.pathname;
        return path.substring(path.lastIndexOf('/') + 1) || 'untitled';
    }

    /**
     * Update viewer with new settings (2025 pattern)
     * @public
     */
    function updateSettings(settings) {
        console.log('Viewer: Updating settings with 2025 pattern', settings);

        // Apply theme with smooth transition
        if (settings.theme) {
            applyTheme(settings.theme);
        }

        // Update line numbers with performance optimization
        const pre = document.querySelector('.fv-content');
        const hasLineNumbers = pre?.classList.contains('fv-line-numbers');

        if (settings.showLineNumbers && !hasLineNumbers && pre) {
            // Use requestAnimationFrame for smooth UI updates (2025 pattern)
            requestAnimationFrame(() => {
                pre.classList.add('fv-line-numbers');
                const code = document.querySelector('.fv-content code');
                if (code) {
                    // More accurate line counting
                    const textContent = code.textContent || '';
                    const lines = textContent.split('\n').length;
                    addLineNumbersForCount(pre, lines);
                }
            });
        } else if (!settings.showLineNumbers && hasLineNumbers) {
            requestAnimationFrame(() => {
                pre?.classList.remove('fv-line-numbers');
                const lineNumbersWrapper = document.querySelector('.fv-line-numbers-wrapper');
                lineNumbersWrapper?.remove();
            });
        }

        // Update other visual settings
        if (settings.indentSize) {
            document.documentElement.style.setProperty('--fv-indent-size', `${settings.indentSize}ch`);
        }
    }

    /**
     * Add line numbers for a specific count
     * @private
     */
    function addLineNumbersForCount(pre, lineCount) {
        // Remove existing line numbers
        const existing = pre.querySelector('.fv-line-numbers-wrapper');
        if (existing) existing.remove();

        const lineNumbers = document.createElement('div');
        lineNumbers.className = 'fv-line-numbers-wrapper';

        for (let i = 1; i <= lineCount; i++) {
            const lineNumber = document.createElement('div');
            lineNumber.className = 'fv-line-number';
            lineNumber.textContent = i;
            lineNumbers.appendChild(lineNumber);
        }

        pre.appendChild(lineNumbers);
    }

    /**
     * Format file size
     * @private
     */
    function formatFileSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }

    /**
     * Format metadata
     * @private
     */
    function formatMetadata(metadata) {
        return Object.entries(metadata)
            .map(([key, value]) => `${key}: ${value}`)
            .join(' | ');
    }

    /**
     * Show toast notification
     * @private
     */
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'fv-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('fv-toast-show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('fv-toast-show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    /**
     * Handle window resize
     * @private
     */
    function handleResize() {
        // Update line numbers height if needed
        const lineNumbersWrapper = document.querySelector('.fv-line-numbers-wrapper');
        const content = document.querySelector('.fv-content');
        if (lineNumbersWrapper && content) {
            const contentHeight = content.scrollHeight;
            lineNumbersWrapper.style.height = `${contentHeight - 32}px`;
        }
    }

    return {
        render,
        updateSettings
    };
})();