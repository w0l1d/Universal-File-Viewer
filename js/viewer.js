/**
 * 🦊 Native Multi-Format Viewer - Viewer Implementation
 * Inline content display with native Firefox styling
 */

class InlineViewer {
    constructor() {
        console.log('🦊 InlineViewer constructor called');
        this.fileData = null;
        this.currentContent = '';
        this.currentFormat = '';
        this.currentView = 'pretty'; // Default to pretty view
        this.searchTerm = '';

        console.log('🦊 About to initialize elements');
        this.initializeElements();
        console.log('🦊 Elements initialized:', Object.keys(this.elements));
        this.bindEvents();
        this.loadFileFromHash();
    }

    initializeElements() {
        this.elements = {
            loading: document.getElementById('loading'),
            error: document.getElementById('error'),
            errorMessage: document.getElementById('errorMessage'),
            content: document.getElementById('content'),
            formatBadge: document.getElementById('formatBadge'),
            filename: document.getElementById('filename'),
            filesize: document.getElementById('filesize'),
            searchBox: document.getElementById('searchBox'),
            prettyBtn: document.getElementById('prettyBtn'),
            rawBtn: document.getElementById('rawBtn'),
            copyUrlBtn: document.getElementById('copyUrlBtn'),
            headersBtn: document.getElementById('headersBtn'),
            downloadBtn: document.getElementById('downloadBtn'),
            headersModal: document.getElementById('headersModal'),
            headersModalOverlay: document.getElementById('headersModalOverlay'),
            headersModalClose: document.getElementById('headersModalClose'),
            responseHeaders: document.getElementById('responseHeaders'),
            requestHeaders: document.getElementById('requestHeaders')
        };
    }

    bindEvents() {
        // View toggle buttons
        this.elements.prettyBtn.addEventListener('click', () => this.switchView('pretty'));
        this.elements.rawBtn.addEventListener('click', () => this.switchView('raw'));

        // Copy URL button
        this.elements.copyUrlBtn.addEventListener('click', () => this.copyOriginalUrl());

        // Headers button
        this.elements.headersBtn.addEventListener('click', () => this.showHeadersModal());

        // Download button
        this.elements.downloadBtn.addEventListener('click', () => this.downloadFile());

        // Headers modal events
        this.elements.headersModalClose.addEventListener('click', () => this.hideHeadersModal());
        this.elements.headersModalOverlay.addEventListener('click', () => this.hideHeadersModal());

        // Search functionality
        this.elements.searchBox.addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            if (this.currentView === 'pretty') {
                this.highlightSearchResults();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'f':
                        e.preventDefault();
                        this.elements.searchBox.focus();
                        this.elements.searchBox.select();
                        break;
                    case 'r':
                        e.preventDefault();
                        this.toggleView();
                        break;
                    case 's':
                        e.preventDefault();
                        this.downloadFile();
                        break;
                    case 'u':
                        e.preventDefault();
                        this.copyOriginalUrl();
                        break;
                    case 'h':
                        e.preventDefault();
                        this.showHeadersModal();
                        break;
                }
            }
        });

        // Handle hash changes
        window.addEventListener('hashchange', () => this.loadFileFromHash());
    }

    downloadFile() {
        if (!this.currentContent || !this.fileData) {
            console.error('🦊 No content available for download');
            return;
        }

        try {
            // Get filename from URL or use default
            const filename = this.getFilenameFromUrl(this.fileData.originalUrl) ||
                           `file.${this.currentFormat}`;

            // Create blob with appropriate MIME type
            const mimeType = this.getMimeTypeForFormat(this.currentFormat);
            const blob = new Blob([this.currentContent], { type: mimeType });

            // Create download URL
            const downloadUrl = URL.createObjectURL(blob);

            // Create temporary link and trigger download
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            link.style.display = 'none';

            // Add to DOM, click, and remove
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Clean up the blob URL
            setTimeout(() => URL.revokeObjectURL(downloadUrl), 100);

            console.log('🦊 File download initiated:', filename);

            // Track download usage
            this.sendMessage({
                action: 'trackUsage',
                format: 'download_' + this.currentFormat
            });

        } catch (error) {
            console.error('🦊 Download failed:', error);
            this.showError('Failed to download file: ' + error.message);
        }
    }

    getFilenameFromUrl(url) {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const filename = pathname.split('/').pop();

            // If filename has extension, return it
            if (filename && filename.includes('.')) {
                return filename;
            }

            // Otherwise, create filename with format extension
            return null;
        } catch (error) {
            return null;
        }
    }

    getMimeTypeForFormat(format) {
        const mimeTypes = {
            'json': 'application/json',
            'yaml': 'application/x-yaml',
            'yml': 'application/x-yaml',
            'xml': 'application/xml',
            'csv': 'text/csv',
            'toml': 'application/toml'
        };

        return mimeTypes[format.toLowerCase()] || 'text/plain';
    }

    async copyOriginalUrl() {
        if (!this.fileData || !this.fileData.originalUrl) {
            console.error('🦊 No original URL available to copy');
            return;
        }

        try {
            // Use the modern Clipboard API if available
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(this.fileData.originalUrl);
                console.log('🦊 URL copied to clipboard:', this.fileData.originalUrl);
            } else {
                // Fallback for older browsers
                this.copyToClipboardFallback(this.fileData.originalUrl);
            }

            // Show visual feedback
            this.showCopyFeedback();

            // Track copy usage
            this.sendMessage({
                action: 'trackUsage',
                format: 'copy_url_' + this.currentFormat
            });

        } catch (error) {
            console.error('🦊 Copy to clipboard failed:', error);

            // Try fallback method on error
            try {
                this.copyToClipboardFallback(this.fileData.originalUrl);
                this.showCopyFeedback();
            } catch (fallbackError) {
                console.error('🦊 Fallback copy failed:', fallbackError);
                this.showError('Failed to copy URL to clipboard');
            }
        }
    }

    copyToClipboardFallback(text) {
        // Create temporary input element
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        // Execute copy command
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (!successful) {
            throw new Error('Copy command failed');
        }

        console.log('🦊 URL copied using fallback method');
    }

    showCopyFeedback() {
        const button = this.elements.copyUrlBtn;
        const originalText = button.innerHTML;

        // Show success state
        button.classList.add('copied');
        button.innerHTML = '<span class="fv-copy-icon">✓</span>Copied!';

        // Reset after 2 seconds
        setTimeout(() => {
            button.classList.remove('copied');
            button.innerHTML = originalText;
        }, 2000);
    }

    showHeadersModal() {
        console.log('🦊 Showing headers modal');
        this.populateHeaders();
        this.elements.headersModal.style.display = 'flex';

        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';

        // Add escape key listener
        this.escapeKeyHandler = (e) => {
            if (e.key === 'Escape') {
                this.hideHeadersModal();
            }
        };
        document.addEventListener('keydown', this.escapeKeyHandler);
    }

    hideHeadersModal() {
        console.log('🦊 Hiding headers modal');
        this.elements.headersModal.style.display = 'none';

        // Restore body scroll
        document.body.style.overflow = '';

        // Remove escape key listener
        if (this.escapeKeyHandler) {
            document.removeEventListener('keydown', this.escapeKeyHandler);
            this.escapeKeyHandler = null;
        }
    }

    populateHeaders() {
        console.log('🦊 Populating headers with fileData:', this.fileData);

        // Clear existing headers
        this.elements.responseHeaders.innerHTML = '';
        this.elements.requestHeaders.innerHTML = '';

        // Populate response headers - check multiple sources
        let headers = null;
        if (this.responseHeaders) {
            headers = this.responseHeaders;
        } else if (this.fileData && this.fileData.headers) {
            headers = this.fileData.headers;
        }

        if (headers && Object.keys(headers).length > 0) {
            const responseHeadersHtml = Object.entries(headers)
                .map(([name, value]) =>
                    `<div class="fv-header-item">
                        <div class="fv-header-name">${this.escapeHtml(name)}:</div>
                        <div class="fv-header-value">${this.escapeHtml(value)}</div>
                    </div>`
                ).join('');

            this.elements.responseHeaders.innerHTML = responseHeadersHtml;
        } else {
            this.elements.responseHeaders.innerHTML = '<div class="fv-headers-empty">No response headers available</div>';
        }

        // Populate request headers (basic ones that were likely sent)
        const requestHeadersData = {
            'Accept': '*/*',
            'Accept-Language': navigator.language || 'en-US,en;q=0.9',
            'User-Agent': navigator.userAgent,
            'Referrer': document.referrer || 'No referrer'
        };

        const requestHeadersHtml = Object.entries(requestHeadersData)
            .map(([name, value]) =>
                `<div class="fv-header-item">
                    <div class="fv-header-name">${this.escapeHtml(name)}:</div>
                    <div class="fv-header-value">${this.escapeHtml(value)}</div>
                </div>`
            ).join('');

        this.elements.requestHeaders.innerHTML = requestHeadersHtml;
    }

    async loadFileFromHash() {
        try {
            const hash = window.location.hash.slice(1);
            if (!hash) {
                throw new Error('No file information provided');
            }

            this.fileData = JSON.parse(decodeURIComponent(hash));
            console.log('🦊 Loading file:', this.fileData);

            this.updateFileInfo();
            await this.fetchAndDisplayFile();

        } catch (error) {
            console.error('🦊 Failed to load file from hash:', error);
            this.showError('Invalid file information provided');
        }
    }

    updateFileInfo() {
        const { originalUrl, format } = this.fileData;

        try {
            const url = new URL(originalUrl);
            const filename = url.pathname.split('/').pop() || 'unknown';

            this.elements.formatBadge.textContent = format.toUpperCase();
            this.elements.filename.textContent = filename;
            this.currentFormat = format;

            // Update page title
            document.title = `${filename} - File Viewer`;

        } catch (error) {
            this.elements.filename.textContent = 'Unknown file';
        }
    }

    async fetchAndDisplayFile() {
        try {
            this.showLoading();

            console.log('🦊 Fetching file:', this.fileData.originalUrl);
            console.log('🦊 File data:', this.fileData);

            let response;

            // Check if we have cached content
            if (this.fileData.cacheKey) {
                console.log('🦊 Using cached content:', this.fileData.cacheKey);
                response = await this.sendMessage({
                    action: 'getCachedContent',
                    cacheKey: this.fileData.cacheKey
                });
            } else {
                console.log('🦊 Fetching content from URL');
                // Fallback to direct fetch
                response = await this.sendMessage({
                    action: 'fetchFile',
                    url: this.fileData.originalUrl
                });
            }

            console.log('🦊 Fetch response:', response);

            if (!response || !response.success) {
                const errorMsg = response?.error || 'Unknown error occurred';
                throw new Error(errorMsg);
            }

            this.currentContent = response.content;

            // Store response headers if available
            if (response.headers) {
                this.responseHeaders = response.headers;
                console.log('🦊 Response headers stored:', this.responseHeaders);
            }

            // Update file size
            const sizeKB = (response.size / 1024).toFixed(1);
            this.elements.filesize.textContent = `${sizeKB}KB`;

            // Track usage
            this.sendMessage({
                action: 'trackUsage',
                format: this.currentFormat
            });

            console.log('🦊 About to display content, length:', this.currentContent.length);
            this.displayContent();

        } catch (error) {
            console.error('🦊 Failed to fetch file content:', error);
            this.showError(`Failed to load file: ${error.message}`);
        }
    }

    displayContent() {
        console.log('🦊 Display content called, view:', this.currentView);
        this.hideLoading();

        if (this.currentView === 'raw') {
            console.log('🦊 Displaying raw content');
            this.displayRawContent();
        } else {
            console.log('🦊 Displaying pretty content');
            this.displayPrettyContent();
        }

        this.elements.content.classList.add('loaded');
        this.elements.content.style.display = 'block'; // Force visibility
        console.log('🦊 Content display completed');
        console.log('🦊 Content element classes:', this.elements.content.className);
        console.log('🦊 Content element style:', getComputedStyle(this.elements.content).display);
    }

    displayRawContent() {
        console.log('🦊 Displaying raw content, length:', this.currentContent.length);
        const highlightedContent = this.highlightRawContent(this.currentContent, this.currentFormat);
        this.elements.content.innerHTML = `
            <pre class="fv-raw-content">${highlightedContent}</pre>
        `;
        console.log('🦊 Raw content innerHTML set');
    }

    displayPrettyContent() {
        console.log('🦊 Parsing content, format:', this.currentFormat);
        try {
            const parsedData = this.parseContent(this.currentContent, this.currentFormat);
            console.log('🦊 Parsed data:', parsedData);

            const treeHtml = this.renderTree(parsedData);
            console.log('🦊 Tree HTML length:', treeHtml.length);

            this.elements.content.innerHTML = `<div class="fv-tree">${treeHtml}</div>`;

            // Add click handlers for tree expansion
            this.bindTreeEvents();

            // Apply search highlighting if there's a search term
            if (this.searchTerm) {
                this.highlightSearchResults();
            }

        } catch (error) {
            console.error('🦊 Parse error:', error);
            this.elements.content.innerHTML = `
                <div class="fv-error">
                    <div class="fv-error-title">Parse Error</div>
                    <div>Failed to parse ${this.currentFormat.toUpperCase()} content: ${error.message}</div>
                </div>
                <pre class="fv-raw-content">${this.escapeHtml(this.currentContent)}</pre>
            `;
        }
    }

    highlightRawContent(content, format) {
        // Apply syntax highlighting based on format (without escaping first)
        let highlightedContent;

        console.log('🦊 Raw highlighting - Format detected:', format);
        console.log('🦊 Raw highlighting - Content preview:', content.substring(0, 100) + '...');

        switch (format.toLowerCase()) {
            case 'json':
                highlightedContent = this.highlightJson(content);
                break;
            case 'yaml':
            case 'yml':
                highlightedContent = this.highlightYaml(content);
                break;
            case 'xml':
                highlightedContent = this.highlightXml(content);
                break;
            case 'csv':
                highlightedContent = this.highlightCsv(content);
                break;
            case 'toml':
                highlightedContent = this.highlightToml(content);
                break;
            default:
                // No highlighting for unknown formats - just escape
                highlightedContent = this.escapeHtml(content);
                break;
        }

        return highlightedContent;
    }

    highlightJson(content) {
        // Escape HTML first
        const escapedContent = this.escapeHtml(content);

        return escapedContent
            // Strings (including keys)
            .replace(/&quot;([^&]*?)&quot;/g, '<span class="fv-tree-value string">&quot;$1&quot;</span>')
            // Numbers
            .replace(/\b(-?\d+\.?\d*([eE][+-]?\d+)?)\b/g, '<span class="fv-tree-value number">$1</span>')
            // Booleans
            .replace(/\b(true|false)\b/g, '<span class="fv-tree-value boolean">$1</span>')
            // Null
            .replace(/\bnull\b/g, '<span class="fv-tree-value null">null</span>')
            // Structural characters
            .replace(/([{}[\],:])/g, '<span class="fv-tree-bracket">$1</span>');
    }

    highlightYaml(content) {
        // Escape HTML first
        const escapedContent = this.escapeHtml(content);

        return escapedContent
            // YAML comments
            .replace(/(#.*$)/gm, '<span class="fv-comment">$1</span>')
            // YAML list markers
            .replace(/(\n\s*)(-)(\s)/g, '$1<span class="fv-tree-colon">$2</span>$3')
            // YAML keys (word followed by colon)
            .replace(/([a-zA-Z_][a-zA-Z0-9_\-]*)\s*:/g, '<span class="fv-tree-key">$1</span><span class="fv-tree-colon">:</span>')
            // YAML strings (quoted values)
            .replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, '<span class="fv-tree-string">"$1"</span>')
            .replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, '<span class="fv-tree-string">\'$1\'</span>')
            // YAML numbers
            .replace(/(\s|^|:)(-?\d+\.?\d*)\s*$/gm, '$1<span class="fv-tree-number">$2</span>')
            // YAML booleans
            .replace(/(\s|^|:)(true|false|yes|no|on|off)\s*$/gmi, '$1<span class="fv-tree-boolean">$2</span>')
            // YAML null values
            .replace(/(\s|^|:)(null|~)\s*$/gmi, '$1<span class="fv-tree-null">$2</span>');
    }

    highlightXml(content) {
        // Escape HTML first
        const escapedContent = this.escapeHtml(content);

        return escapedContent
            // Comments first
            .replace(/(&lt;!--.*?--&gt;)/gs, '<span class="fv-comment">$1</span>')
            // CDATA sections
            .replace(/(&lt;!\[CDATA\[.*?\]\]&gt;)/gs, '<span class="fv-xml-cdata">$1</span>')
            // XML tags
            .replace(/(&lt;\/?)([\w:-]+)([^&]*?)(&gt;)/g, '$1<span class="fv-xml-tag">$2</span>$3$4')
            // Attributes (simple version)
            .replace(/(\s)([\w:-]+)(=)(&quot;[^&]*?&quot;)/g, '$1<span class="fv-xml-attr">$2</span>$3<span class="fv-tree-value string">$4</span>');
    }

    highlightCsv(content) {
        // Escape HTML first
        const escapedContent = this.escapeHtml(content);

        const lines = escapedContent.split('\n');
        return lines.map((line, index) => {
            if (!line.trim()) return line;

            if (index === 0) {
                // Header row - simple comma separation
                return line.replace(/([^,]+)/g, (match) => {
                    return `<span class="fv-tree-key">${match.trim()}</span>`;
                });
            } else {
                // Data rows - only highlight quoted strings
                return line.replace(/&quot;([^&]*)&quot;/g, '<span class="fv-tree-value string">&quot;$1&quot;</span>');
            }
        }).join('\n');
    }

    highlightToml(content) {
        // Escape HTML first
        const escapedContent = this.escapeHtml(content);

        const lines = escapedContent.split('\n');
        const highlightedLines = lines.map(line => {
            if (!line.trim()) {
                return line;
            }

            let highlightedLine = line;

            // Comments first
            if (line.includes('#')) {
                const commentIndex = line.indexOf('#');
                const beforeComment = line.substring(0, commentIndex);
                const comment = line.substring(commentIndex);
                highlightedLine = beforeComment + `<span class="fv-comment">${comment}</span>`;
            }

            // Section headers
            if (line.match(/^\s*\[([^\]]+)\]/)) {
                highlightedLine = highlightedLine.replace(
                    /^(\s*)\[([^\]]+)\]/,
                    '$1<span class="fv-tree-bracket">[</span><span class="fv-xml-tag">$2</span><span class="fv-tree-bracket">]</span>'
                );
            }

            // Key-value pairs
            if (line.match(/^\s*[a-zA-Z_][a-zA-Z0-9_-]*\s*=/)) {
                highlightedLine = highlightedLine.replace(
                    /^(\s*)([a-zA-Z_][a-zA-Z0-9_-]*)\s*(=)/,
                    '$1<span class="fv-tree-key">$2</span><span class="fv-tree-colon"> $3 </span>'
                );
            }

            // Strings in quotes
            highlightedLine = highlightedLine.replace(
                /(&quot;)([^&]*?)(&quot;)/g,
                '<span class="fv-tree-value string">$1$2$3</span>'
            );

            return highlightedLine;
        });

        return highlightedLines.join('\n');
    }

    parseContent(content, format) {
        switch (format.toLowerCase()) {
            case 'json':
                return JSON.parse(content);

            case 'yaml':
            case 'yml':
                console.log('🦊 Checking YAML parser availability:', typeof jsyaml);
                if (typeof jsyaml !== 'undefined') {
                    const result = jsyaml.load(content);
                    console.log('🦊 YAML parsed successfully:', result);
                    return result;
                }
                throw new Error('YAML parser not available');

            case 'xml':
                return this.parseXml(content);

            case 'csv':
                return this.parseCsv(content);

            case 'toml':
                return this.parseToml(content);

            default:
                throw new Error(`Unsupported format: ${format}`);
        }
    }

    parseXml(content) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/xml');

        if (doc.getElementsByTagName('parsererror').length > 0) {
            throw new Error('Invalid XML content');
        }

        return this.xmlToObject(doc);
    }

    parseCsv(content) {
        const lines = content.trim().split('\n');
        if (lines.length === 0) return [];

        const headers = this.parseCsvLine(lines[0]);
        const rows = lines.slice(1).map(line => {
            const values = this.parseCsvLine(line);
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            return row;
        });

        return { headers, rows, totalRows: rows.length };
    }

    parseToml(content) {
        // Basic TOML parsing - expand as needed
        const result = {};
        const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));

        let currentSection = result;

        for (const line of lines) {
            if (line.startsWith('[') && line.endsWith(']')) {
                const section = line.slice(1, -1);
                currentSection = result[section] = {};
            } else if (line.includes('=')) {
                const [key, ...valueParts] = line.split('=');
                const value = valueParts.join('=').trim();
                currentSection[key.trim()] = this.parseTomlValue(value);
            }
        }

        return result;
    }

    renderTree(data, level = 0) {
        if (data === null || data === undefined) {
            return this.renderValue(data, level);
        }

        if (Array.isArray(data)) {
            return this.renderArray(data, level);
        }

        if (typeof data === 'object') {
            return this.renderObject(data, level);
        }

        return this.renderValue(data, level);
    }

    renderObject(obj, level = 0) {
        const keys = Object.keys(obj);
        if (keys.length === 0) {
            return `<div class="fv-tree-line">
                ${this.getIndent(level)}
                <span class="fv-tree-content">{}</span>
            </div>`;
        }

        const lines = [];

        // For root level, don't show the opening brace
        if (level === 0) {
            keys.forEach((key, index) => {
                const value = obj[key];
                lines.push(this.renderProperty(key, value, level));
            });
        } else {
            // For nested objects, show collapsible structure
            lines.push(`<div class="fv-tree-node">`);
            lines.push(`<div class="fv-tree-line">
                ${this.getIndent(level)}
                <span class="fv-tree-icon" data-action="toggle">▼</span>
                <span class="fv-tree-content">
                    <span class="fv-tree-bracket">{</span>
                    <span class="fv-tree-summary">${keys.length} items</span>
                    <span class="fv-tree-bracket">}</span>
                </span>
            </div>`);

            lines.push(`<div class="fv-tree-children">`);
            keys.forEach((key, index) => {
                const value = obj[key];
                lines.push(this.renderProperty(key, value, level + 1));
            });
            lines.push(`</div>`);
            lines.push(`</div>`);
        }

        return lines.join('');
    }

    renderArray(arr, level = 0) {
        if (arr.length === 0) {
            return `<div class="fv-tree-line">
                ${this.getIndent(level)}
                <span class="fv-tree-content">[]</span>
            </div>`;
        }

        const lines = [];

        // For root level arrays, show each item directly
        if (level === 0) {
            arr.forEach((item, index) => {
                lines.push(this.renderArrayItem(index, item, level));
            });
        } else {
            // For nested arrays, show collapsible structure
            lines.push(`<div class="fv-tree-node">`);
            lines.push(`<div class="fv-tree-line">
                ${this.getIndent(level)}
                <span class="fv-tree-icon" data-action="toggle">▼</span>
                <span class="fv-tree-content">
                    <span class="fv-tree-bracket">[</span>
                    <span class="fv-tree-summary">${arr.length} items</span>
                    <span class="fv-tree-bracket">]</span>
                </span>
            </div>`);

            lines.push(`<div class="fv-tree-children">`);
            arr.forEach((item, index) => {
                lines.push(this.renderArrayItem(index, item, level + 1));
            });
            lines.push(`</div>`);
            lines.push(`</div>`);
        }

        return lines.join('');
    }

    renderProperty(key, value, level) {
        if (value === null || typeof value !== 'object') {
            // Simple property
            return `<div class="fv-tree-line">
                ${this.getIndent(level)}
                <span class="fv-tree-content">
                    <span class="fv-tree-key">"${this.escapeHtml(key)}"</span>
                    <span class="fv-tree-colon">:</span>
                    ${this.renderValue(value)}
                </span>
            </div>`;
        } else if (Array.isArray(value)) {
            // Array property
            if (value.length === 0) {
                return `<div class="fv-tree-line">
                    ${this.getIndent(level)}
                    <span class="fv-tree-content">
                        <span class="fv-tree-key">"${this.escapeHtml(key)}"</span>
                        <span class="fv-tree-colon">:</span>
                        <span class="fv-tree-value">[]</span>
                    </span>
                </div>`;
            }

            const lines = [`<div class="fv-tree-node">`];
            lines.push(`<div class="fv-tree-line">
                ${this.getIndent(level)}
                <span class="fv-tree-icon" data-action="toggle">▼</span>
                <span class="fv-tree-content">
                    <span class="fv-tree-key">"${this.escapeHtml(key)}"</span>
                    <span class="fv-tree-colon">:</span>
                    <span class="fv-tree-bracket">[</span>
                    <span class="fv-tree-summary">${value.length} items</span>
                    <span class="fv-tree-bracket">]</span>
                </span>
            </div>`);

            lines.push(`<div class="fv-tree-children">`);
            value.forEach((item, index) => {
                lines.push(this.renderArrayItem(index, item, level + 1));
            });
            lines.push(`</div>`);
            lines.push(`</div>`);

            return lines.join('');
        } else {
            // Object property
            const keys = Object.keys(value);
            if (keys.length === 0) {
                return `<div class="fv-tree-line">
                    ${this.getIndent(level)}
                    <span class="fv-tree-content">
                        <span class="fv-tree-key">"${this.escapeHtml(key)}"</span>
                        <span class="fv-tree-colon">:</span>
                        <span class="fv-tree-value">{}</span>
                    </span>
                </div>`;
            }

            const lines = [`<div class="fv-tree-node">`];
            lines.push(`<div class="fv-tree-line">
                ${this.getIndent(level)}
                <span class="fv-tree-icon" data-action="toggle">▼</span>
                <span class="fv-tree-content">
                    <span class="fv-tree-key">"${this.escapeHtml(key)}"</span>
                    <span class="fv-tree-colon">:</span>
                    <span class="fv-tree-bracket">{</span>
                    <span class="fv-tree-summary">${keys.length} items</span>
                    <span class="fv-tree-bracket">}</span>
                </span>
            </div>`);

            lines.push(`<div class="fv-tree-children">`);
            keys.forEach((childKey) => {
                lines.push(this.renderProperty(childKey, value[childKey], level + 1));
            });
            lines.push(`</div>`);
            lines.push(`</div>`);

            return lines.join('');
        }
    }

    renderArrayItem(index, item, level) {
        if (item === null || typeof item !== 'object') {
            // Simple array item
            return `<div class="fv-tree-line">
                ${this.getIndent(level)}
                <span class="fv-tree-content">
                    <span class="fv-tree-key">${index}</span>
                    <span class="fv-tree-colon">:</span>
                    ${this.renderValue(item)}
                </span>
            </div>`;
        } else if (Array.isArray(item)) {
            // Nested array
            const lines = [`<div class="fv-tree-node">`];
            lines.push(`<div class="fv-tree-line">
                ${this.getIndent(level)}
                <span class="fv-tree-icon" data-action="toggle">▼</span>
                <span class="fv-tree-content">
                    <span class="fv-tree-key">${index}</span>
                    <span class="fv-tree-colon">:</span>
                    <span class="fv-tree-bracket">[</span>
                    <span class="fv-tree-summary">${item.length} items</span>
                    <span class="fv-tree-bracket">]</span>
                </span>
            </div>`);

            lines.push(`<div class="fv-tree-children">`);
            item.forEach((subItem, subIndex) => {
                lines.push(this.renderArrayItem(subIndex, subItem, level + 1));
            });
            lines.push(`</div>`);
            lines.push(`</div>`);

            return lines.join('');
        } else {
            // Object in array
            const keys = Object.keys(item);
            const lines = [`<div class="fv-tree-node">`];
            lines.push(`<div class="fv-tree-line">
                ${this.getIndent(level)}
                <span class="fv-tree-icon" data-action="toggle">▼</span>
                <span class="fv-tree-content">
                    <span class="fv-tree-key">${index}</span>
                    <span class="fv-tree-colon">:</span>
                    <span class="fv-tree-bracket">{</span>
                    <span class="fv-tree-summary">${keys.length} items</span>
                    <span class="fv-tree-bracket">}</span>
                </span>
            </div>`);

            lines.push(`<div class="fv-tree-children">`);
            keys.forEach((childKey) => {
                lines.push(this.renderProperty(childKey, item[childKey], level + 1));
            });
            lines.push(`</div>`);
            lines.push(`</div>`);

            return lines.join('');
        }
    }

    renderInlineValue(value, level) {
        if (value === null) {
            return `<span class="fv-tree-value null">null</span>`;
        }

        if (Array.isArray(value)) {
            if (value.length === 0) return `<span class="fv-tree-value">[]</span>`;
            return `<span class="fv-tree-summary">[${value.length} items]</span>`;
        }

        if (typeof value === 'object') {
            const keys = Object.keys(value);
            if (keys.length === 0) return `<span class="fv-tree-value">{}</span>`;
            return `<span class="fv-tree-summary">{${keys.length} items}</span>`;
        }

        return this.renderValue(value, level);
    }

    renderValue(value, level) {
        if (value === null) {
            return `<span class="fv-tree-value null">null</span>`;
        }

        const type = typeof value;
        const className = `fv-tree-value ${type}`;

        if (type === 'string') {
            return `<span class="${className}">"${this.escapeHtml(value)}"</span>`;
        }

        return `<span class="${className}">${this.escapeHtml(String(value))}</span>`;
    }

    getIndent(level) {
        return '<span class="fv-tree-indent"></span>'.repeat(level);
    }

    bindTreeEvents() {
        this.elements.content.addEventListener('click', (e) => {
            if (e.target.dataset.action === 'toggle') {
                const node = e.target.closest('.fv-tree-node');
                if (node) {
                    node.classList.toggle('fv-tree-collapsed');
                    const icon = e.target;
                    icon.textContent = node.classList.contains('fv-tree-collapsed') ? '▶' : '▼';
                }
            }
        });
    }

    switchView(view) {
        if (view === this.currentView) return;

        this.currentView = view;

        // Update button states
        this.elements.prettyBtn.classList.toggle('active', view === 'pretty');
        this.elements.rawBtn.classList.toggle('active', view === 'raw');

        // Redisplay content
        this.displayContent();
    }

    toggleView() {
        this.switchView(this.currentView === 'pretty' ? 'raw' : 'pretty');
    }

    highlightSearchResults() {
        if (!this.searchTerm || this.currentView !== 'pretty') return;

        // Remove existing highlights
        const existing = this.elements.content.querySelectorAll('.fv-highlight');
        existing.forEach(el => {
            const parent = el.parentNode;
            parent.replaceChild(document.createTextNode(el.textContent), el);
            parent.normalize();
        });

        if (this.searchTerm.length < 2) return;

        // Add new highlights
        const walker = document.createTreeWalker(
            this.elements.content,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }

        textNodes.forEach(textNode => {
            const text = textNode.textContent;
            const lowerText = text.toLowerCase();
            const index = lowerText.indexOf(this.searchTerm);

            if (index !== -1) {
                const before = text.substring(0, index);
                const match = text.substring(index, index + this.searchTerm.length);
                const after = text.substring(index + this.searchTerm.length);

                const fragment = document.createDocumentFragment();
                if (before) fragment.appendChild(document.createTextNode(before));

                const highlight = document.createElement('span');
                highlight.className = 'fv-highlight';
                highlight.textContent = match;
                fragment.appendChild(highlight);

                if (after) fragment.appendChild(document.createTextNode(after));

                textNode.parentNode.replaceChild(fragment, textNode);
            }
        });
    }

    showLoading() {
        this.elements.loading.style.display = 'flex';
        this.elements.error.style.display = 'none';
        this.elements.content.style.display = 'none';
    }

    hideLoading() {
        this.elements.loading.style.display = 'none';
    }

    showError(message) {
        this.hideLoading();
        this.elements.error.style.display = 'block';
        this.elements.errorMessage.textContent = message;
        this.elements.content.style.display = 'none';
    }

    // Utility methods
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    xmlToObject(xmlNode) {
        const obj = {};

        if (xmlNode.nodeType === Node.TEXT_NODE) {
            return xmlNode.nodeValue.trim();
        }

        if (xmlNode.hasAttributes()) {
            obj['@attributes'] = {};
            for (const attr of xmlNode.attributes) {
                obj['@attributes'][attr.name] = attr.value;
            }
        }

        const children = Array.from(xmlNode.childNodes);
        const textChildren = children.filter(child => child.nodeType === Node.TEXT_NODE);
        const elementChildren = children.filter(child => child.nodeType === Node.ELEMENT_NODE);

        if (textChildren.length > 0 && elementChildren.length === 0) {
            const text = textChildren.map(child => child.nodeValue).join('').trim();
            return text || obj;
        }

        elementChildren.forEach(child => {
            const key = child.tagName;
            const value = this.xmlToObject(child);

            if (obj[key]) {
                if (!Array.isArray(obj[key])) {
                    obj[key] = [obj[key]];
                }
                obj[key].push(value);
            } else {
                obj[key] = value;
            }
        });

        return obj;
    }

    parseCsvLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }

        result.push(current.trim());
        return result;
    }

    parseTomlValue(value) {
        value = value.trim();

        if (value === 'true') return true;
        if (value === 'false') return false;
        if (!isNaN(value)) return Number(value);
        if (value.startsWith('"') && value.endsWith('"')) {
            return value.slice(1, -1);
        }

        return value;
    }

    sendMessage(message) {
        return new Promise((resolve, reject) => {
            console.log('🦊 Sending message:', message);

            if (typeof browser !== 'undefined' && browser.runtime) {
                browser.runtime.sendMessage(message, response => {
                    console.log('🦊 Message response:', response);
                    console.log('🦊 Runtime error:', browser.runtime.lastError);

                    if (browser.runtime.lastError) {
                        reject(new Error(browser.runtime.lastError.message));
                    } else if (response === undefined) {
                        reject(new Error('No response received from background script'));
                    } else {
                        resolve(response);
                    }
                });
            } else {
                reject(new Error('Extension runtime not available'));
            }
        });
    }
}

// Initialize viewer when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🦊 Inline viewer initializing...');
    new InlineViewer();
});

// Export for debugging
if (typeof globalThis !== 'undefined') {
    globalThis.InlineViewer = InlineViewer;
}