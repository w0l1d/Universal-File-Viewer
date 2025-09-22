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
     */
    function render(config) {
        rawContent = config.raw;
        formattedContent = config.content;
        currentFormat = config.format;

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

        attachEventHandlers();
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

        header.innerHTML = `
      <div class="fv-header-left">
        <span class="fv-format-badge">${config.format.toUpperCase()}</span>
        <span class="fv-filename">${getFilename()}</span>
      </div>
      <div class="fv-header-controls">
        <button class="fv-btn fv-btn-view" data-action="toggle-view" title="Toggle view">
          <span class="fv-icon">👁</span>
          <span class="fv-btn-text">Raw</span>
        </button>
        <button class="fv-btn fv-btn-copy" data-action="copy" title="Copy to clipboard">
          <span class="fv-icon">📋</span>
          <span class="fv-btn-text">Copy</span>
        </button>
        <button class="fv-btn fv-btn-download" data-action="download" title="Download formatted">
          <span class="fv-icon">💾</span>
          <span class="fv-btn-text">Download</span>
        </button>
        <button class="fv-btn fv-btn-theme" data-action="toggle-theme" title="Toggle theme">
          <span class="fv-icon">🎨</span>
        </button>
      </div>
    `;

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
        code.innerHTML = config.content;
        code.className = `language-${config.format}`;

        // Add line numbers
        if (shouldShowLineNumbers()) {
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

        statusBar.innerHTML = `
      <span class="fv-status-item">Lines: ${lines.toLocaleString()}</span>
      <span class="fv-status-item">Size: ${formatFileSize(size)}</span>
      ${config.metadata ? `<span class="fv-status-item">${formatMetadata(config.metadata)}</span>` : ''}
    `;

        return statusBar;
    }

    /**
     * Create error bar
     * @private
     */
    function createErrorBar(error) {
        const errorBar = document.createElement('div');
        errorBar.className = 'fv-error-bar';
        errorBar.innerHTML = `
      <span class="fv-error-icon">⚠️</span>
      <span class="fv-error-message">${error}</span>
    `;
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
     * Toggle theme
     * @private
     */
    function toggleTheme() {
        const container = document.querySelector('.fv-container');
        const currentTheme = container.dataset.theme;
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        container.dataset.theme = newTheme;
        localStorage.setItem('fv-theme', newTheme);
    }

    /**
     * Get current theme
     * @private
     */
    function getTheme() {
        return localStorage.getItem('fv-theme') ||
            (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
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
     * Check if line numbers should be shown
     * @private
     */
    function shouldShowLineNumbers() {
        return localStorage.getItem('fv-show-line-numbers') !== 'false';
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

    return {
        render
    };
})();