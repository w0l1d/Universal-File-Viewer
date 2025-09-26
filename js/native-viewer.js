/**
 * 🦊 Native Firefox-Style Multi-Format Viewer
 * Simple, clean implementation that feels native to Firefox
 */

(() => {
    'use strict';

    console.log('🦊 Native Multi-Format Viewer initializing...');

    // Configuration
    const CONFIG = {
        supportedExtensions: new Set(['json', 'yaml', 'yml', 'xml', 'csv', 'toml', 'txt', 'md']),
        supportedMimeTypes: new Set([
            'application/json',
            'application/x-yaml', 'application/yaml', 'text/yaml', 'text/x-yaml',
            'text/xml', 'application/xml',
            'text/csv', 'application/csv',
            'application/toml', 'text/toml',
            'text/plain', 'text/markdown'
        ]),
        maxFileSize: 10 * 1024 * 1024, // 10MB
        searchDelay: 300 // ms
    };

    /**
     * Format Detection and Parsing
     */
    class FormatHandler {
        static detect(content, contentType, url) {
            // URL-based detection (most reliable)
            const urlFormat = this.detectFromUrl(url);
            if (urlFormat) return urlFormat;

            // MIME type detection
            const mimeFormat = this.detectFromMimeType(contentType);
            if (mimeFormat) return mimeFormat;

            // Content-based detection
            return this.detectFromContent(content);
        }

        static detectFromUrl(url) {
            try {
                const pathname = new URL(url).pathname.toLowerCase();
                const extension = pathname.split('.').pop();

                const extensionMap = {
                    'json': 'json',
                    'yaml': 'yaml', 'yml': 'yaml',
                    'xml': 'xml',
                    'csv': 'csv',
                    'toml': 'toml',
                    'md': 'markdown',
                    'txt': 'text'
                };

                return extensionMap[extension] || null;
            } catch (e) {
                return null;
            }
        }

        static detectFromMimeType(contentType) {
            if (!contentType) return null;

            const mimeType = contentType.toLowerCase().split(';')[0].trim();
            const mimeMap = {
                'application/json': 'json',
                'application/x-yaml': 'yaml',
                'application/yaml': 'yaml',
                'text/yaml': 'yaml',
                'text/x-yaml': 'yaml',
                'text/xml': 'xml',
                'application/xml': 'xml',
                'text/csv': 'csv',
                'application/csv': 'csv',
                'application/toml': 'toml',
                'text/toml': 'toml',
                'text/markdown': 'markdown'
            };

            return mimeMap[mimeType] || null;
        }

        static detectFromContent(content) {
            const trimmed = content.trim();

            // JSON detection
            if ((trimmed.startsWith('{') || trimmed.startsWith('['))) {
                try {
                    JSON.parse(trimmed);
                    return 'json';
                } catch (e) {
                    // Not valid JSON
                }
            }

            // YAML detection
            if (trimmed.startsWith('---') || /^[a-zA-Z0-9_-]+\s*:/m.test(trimmed)) {
                return 'yaml';
            }

            // XML detection
            if (trimmed.startsWith('<?xml') || /^<[a-zA-Z]/.test(trimmed)) {
                return 'xml';
            }

            // CSV detection
            if (trimmed.includes(',') && (trimmed.match(/,/g) || []).length > 2) {
                const lines = trimmed.split('\n');
                if (lines.length > 1 && lines[0].includes(',')) {
                    return 'csv';
                }
            }

            return 'text';
        }

        static parse(content, format) {
            try {
                switch (format) {
                    case 'json':
                        return { data: JSON.parse(content), success: true };

                    case 'yaml':
                        if (typeof jsyaml !== 'undefined') {
                            return { data: jsyaml.load(content), success: true };
                        }
                        return { data: content, success: false, error: 'YAML parser not available' };

                    case 'xml':
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(content, 'text/xml');
                        if (doc.documentElement.tagName === 'parsererror') {
                            return { data: content, success: false, error: 'Invalid XML' };
                        }
                        return { data: doc, success: true };

                    case 'csv':
                        const lines = content.trim().split('\n');
                        const headers = lines[0].split(',').map(h => h.trim());
                        const rows = lines.slice(1).map(line =>
                            line.split(',').map(cell => cell.trim())
                        );
                        return { data: { headers, rows }, success: true };

                    default:
                        return { data: content, success: true };
                }
            } catch (error) {
                return { data: content, success: false, error: error.message };
            }
        }
    }

    /**
     * Native-Style Tree View Component
     */
    class TreeView {
        constructor(data, format) {
            this.data = data;
            this.format = format;
            this.searchTerm = '';
        }

        render() {
            const container = document.createElement('div');
            container.className = 'fv-tree';

            if (this.format === 'json' || this.format === 'yaml') {
                container.appendChild(this.renderNode(this.data, '', true));
            } else if (this.format === 'xml') {
                container.appendChild(this.renderXmlNode(this.data.documentElement, ''));
            } else if (this.format === 'csv') {
                container.appendChild(this.renderCsvTable(this.data));
            } else {
                container.appendChild(this.renderText(this.data));
            }

            return container;
        }

        renderNode(data, key, isRoot = false) {
            const node = document.createElement('div');
            node.className = 'fv-tree-node';

            if (Array.isArray(data)) {
                node.appendChild(this.renderArrayNode(data, key, isRoot));
            } else if (data && typeof data === 'object') {
                node.appendChild(this.renderObjectNode(data, key, isRoot));
            } else {
                node.appendChild(this.renderValueNode(data, key, isRoot));
            }

            return node;
        }

        renderObjectNode(obj, key, isRoot) {
            const container = document.createElement('div');

            const header = document.createElement('div');
            header.className = 'fv-tree-node-content';

            if (!isRoot) {
                const toggle = document.createElement('span');
                toggle.className = 'fv-tree-toggle expanded';
                toggle.addEventListener('click', (e) => this.toggleNode(e));
                header.appendChild(toggle);

                const keySpan = document.createElement('span');
                keySpan.className = 'fv-tree-key';
                keySpan.textContent = key;
                header.appendChild(keySpan);

                const separator = document.createElement('span');
                separator.className = 'fv-tree-separator';
                separator.textContent = ':';
                header.appendChild(separator);
            }

            const preview = document.createElement('span');
            preview.className = 'fv-tree-value';
            preview.textContent = isRoot ? '' : `{${Object.keys(obj).length} items}`;
            header.appendChild(preview);

            container.appendChild(header);

            const children = document.createElement('div');
            children.className = 'fv-tree-children';

            Object.entries(obj).forEach(([k, v]) => {
                children.appendChild(this.renderNode(v, k));
            });

            container.appendChild(children);
            return container;
        }

        renderArrayNode(arr, key, isRoot) {
            const container = document.createElement('div');

            const header = document.createElement('div');
            header.className = 'fv-tree-node-content';

            if (!isRoot) {
                const toggle = document.createElement('span');
                toggle.className = 'fv-tree-toggle expanded';
                toggle.addEventListener('click', (e) => this.toggleNode(e));
                header.appendChild(toggle);

                const keySpan = document.createElement('span');
                keySpan.className = 'fv-tree-key';
                keySpan.textContent = key;
                header.appendChild(keySpan);

                const separator = document.createElement('span');
                separator.className = 'fv-tree-separator';
                separator.textContent = ':';
                header.appendChild(separator);
            }

            const preview = document.createElement('span');
            preview.className = 'fv-tree-value';
            preview.textContent = isRoot ? '' : `[${arr.length} items]`;
            header.appendChild(preview);

            container.appendChild(header);

            const children = document.createElement('div');
            children.className = 'fv-tree-children';

            arr.forEach((item, index) => {
                children.appendChild(this.renderNode(item, index.toString()));
            });

            container.appendChild(children);
            return container;
        }

        renderValueNode(value, key, isRoot) {
            const container = document.createElement('div');
            const content = document.createElement('div');
            content.className = 'fv-tree-node-content';

            if (!isRoot && key !== '') {
                const keySpan = document.createElement('span');
                keySpan.className = 'fv-tree-key';
                keySpan.textContent = key;
                content.appendChild(keySpan);

                const separator = document.createElement('span');
                separator.className = 'fv-tree-separator';
                separator.textContent = ':';
                content.appendChild(separator);
            }

            const valueSpan = document.createElement('span');
            valueSpan.className = this.getValueClass(value);
            valueSpan.textContent = this.formatValue(value);
            content.appendChild(valueSpan);

            container.appendChild(content);
            return container;
        }

        renderXmlNode(element, depth = '') {
            const container = document.createElement('div');
            container.className = 'fv-xml-element';

            const content = document.createElement('div');
            content.className = 'fv-tree-node-content';

            if (element.children.length > 0) {
                const toggle = document.createElement('span');
                toggle.className = 'fv-tree-toggle expanded';
                toggle.addEventListener('click', (e) => this.toggleNode(e));
                content.appendChild(toggle);
            }

            const tagSpan = document.createElement('span');
            tagSpan.className = 'fv-xml-tag';
            tagSpan.textContent = `<${element.tagName}`;
            content.appendChild(tagSpan);

            // Attributes
            Array.from(element.attributes).forEach(attr => {
                const attrSpan = document.createElement('span');
                attrSpan.className = 'fv-xml-attribute';
                attrSpan.textContent = ` ${attr.name}="${attr.value}"`;
                content.appendChild(attrSpan);
            });

            const closeTag = document.createElement('span');
            closeTag.className = 'fv-xml-tag';
            closeTag.textContent = '>';
            content.appendChild(closeTag);

            container.appendChild(content);

            // Children
            if (element.children.length > 0) {
                const children = document.createElement('div');
                children.className = 'fv-tree-children';

                Array.from(element.children).forEach(child => {
                    children.appendChild(this.renderXmlNode(child, depth + '  '));
                });

                container.appendChild(children);
            } else if (element.textContent.trim()) {
                const textNode = document.createElement('div');
                textNode.className = 'fv-xml-text';
                textNode.textContent = element.textContent.trim();
                container.appendChild(textNode);
            }

            return container;
        }

        renderCsvTable(csvData) {
            const table = document.createElement('table');
            table.className = 'fv-table';

            // Headers
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            csvData.headers.forEach(header => {
                const th = document.createElement('th');
                th.textContent = header;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);

            // Body
            const tbody = document.createElement('tbody');
            csvData.rows.forEach(row => {
                const tr = document.createElement('tr');
                row.forEach(cell => {
                    const td = document.createElement('td');
                    td.textContent = cell;
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            });
            table.appendChild(tbody);

            return table;
        }

        renderText(content) {
            const pre = document.createElement('pre');
            pre.className = 'fv-raw';
            pre.textContent = content;
            return pre;
        }

        toggleNode(event) {
            event.stopPropagation();
            const toggle = event.target;
            const children = toggle.closest('.fv-tree-node').querySelector('.fv-tree-children');

            if (children) {
                const isCollapsed = children.classList.contains('collapsed');
                children.classList.toggle('collapsed');
                toggle.classList.toggle('collapsed', !isCollapsed);
                toggle.classList.toggle('expanded', isCollapsed);
            }
        }

        getValueClass(value) {
            if (value === null) return 'fv-tree-value fv-null';
            if (typeof value === 'string') return 'fv-tree-value fv-string';
            if (typeof value === 'number') return 'fv-tree-value fv-number';
            if (typeof value === 'boolean') return 'fv-tree-value fv-boolean';
            return 'fv-tree-value';
        }

        formatValue(value) {
            if (value === null) return 'null';
            if (typeof value === 'string') return `"${value}"`;
            return String(value);
        }

        search(term) {
            this.searchTerm = term.toLowerCase();
            // Implementation for search highlighting would go here
            // For now, this is a placeholder
        }
    }

    /**
     * Main Native Viewer Class
     */
    class NativeViewer {
        constructor() {
            this.currentView = 'pretty';
            this.searchTerm = '';
            this.data = null;
            this.format = null;
            this.originalContent = '';
        }

        shouldActivate() {
            // Check if this looks like a file we should handle
            const content = document.body.textContent || '';

            // Skip if complex page structure
            if (document.body.children.length > 2) return false;

            // Skip if no meaningful content
            if (content.trim().length < 10) return false;

            // Check for plain file display patterns
            const pre = document.querySelector('pre');
            const hasOnlyPre = document.body.children.length === 1 && pre;

            return hasOnlyPre || document.body.children.length === 0;
        }

        async init() {
            if (!this.shouldActivate()) {
                console.log('🦊 Page not suitable for native viewer');
                return;
            }

            try {
                // Get content
                this.originalContent = document.body.textContent || '';

                // Detect format
                this.format = FormatHandler.detect(
                    this.originalContent,
                    document.contentType,
                    window.location.href
                );

                if (!this.format || this.format === 'text') {
                    console.log('🦊 Format not supported or detected as plain text');
                    return;
                }

                console.log('🦊 Detected format:', this.format);

                // Parse content
                const parseResult = FormatHandler.parse(this.originalContent, this.format);
                this.data = parseResult.data;

                // Create native interface
                this.render();

                console.log('🦊 Native viewer activated successfully');

            } catch (error) {
                console.error('🦊 Native viewer initialization failed:', error);
            }
        }

        render() {
            // Inject CSS
            this.injectCSS();

            // Clear body and create container
            document.body.innerHTML = '';
            document.body.className = '';

            const container = document.createElement('div');
            container.className = 'fv-container';

            // Header
            container.appendChild(this.createHeader());

            // Controls
            container.appendChild(this.createControls());

            // Content
            const content = document.createElement('div');
            content.className = 'fv-content';
            content.id = 'fv-content';

            this.renderContent(content);
            container.appendChild(content);

            document.body.appendChild(container);

            // Set up event listeners
            this.setupEventListeners();
        }

        createHeader() {
            const header = document.createElement('div');
            header.className = 'fv-header';

            const badge = document.createElement('span');
            badge.className = 'fv-format-badge';
            badge.textContent = this.format.toUpperCase();
            header.appendChild(badge);

            const filename = document.createElement('span');
            filename.className = 'fv-filename';
            filename.textContent = this.getFilename();
            header.appendChild(filename);

            const info = document.createElement('span');
            info.className = 'fv-file-info';
            info.textContent = this.getFileInfo();
            header.appendChild(info);

            return header;
        }

        createControls() {
            const controls = document.createElement('div');
            controls.className = 'fv-controls';

            // Search box
            const searchBox = document.createElement('input');
            searchBox.type = 'text';
            searchBox.className = 'fv-search-box';
            searchBox.placeholder = 'Search...';
            searchBox.id = 'fv-search';
            controls.appendChild(searchBox);

            // Toggle buttons
            const toggleGroup = document.createElement('div');
            toggleGroup.className = 'fv-toggle-group';

            const prettyBtn = document.createElement('button');
            prettyBtn.className = 'fv-toggle-btn active';
            prettyBtn.textContent = 'Pretty';
            prettyBtn.dataset.view = 'pretty';
            toggleGroup.appendChild(prettyBtn);

            const rawBtn = document.createElement('button');
            rawBtn.className = 'fv-toggle-btn';
            rawBtn.textContent = 'Raw';
            rawBtn.dataset.view = 'raw';
            toggleGroup.appendChild(rawBtn);

            controls.appendChild(toggleGroup);

            return controls;
        }

        renderContent(container) {
            if (this.currentView === 'raw') {
                const pre = document.createElement('pre');
                pre.className = 'fv-raw';
                pre.textContent = this.originalContent;
                container.innerHTML = '';
                container.appendChild(pre);
            } else {
                const treeView = new TreeView(this.data, this.format);
                container.innerHTML = '';
                container.appendChild(treeView.render());
            }
        }

        setupEventListeners() {
            // Search functionality
            const searchBox = document.getElementById('fv-search');
            let searchTimeout;
            searchBox.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.search(e.target.value);
                }, CONFIG.searchDelay);
            });

            // View toggle
            document.querySelectorAll('.fv-toggle-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    document.querySelectorAll('.fv-toggle-btn').forEach(b =>
                        b.classList.remove('active'));
                    e.target.classList.add('active');

                    this.currentView = e.target.dataset.view;
                    this.renderContent(document.getElementById('fv-content'));
                });
            });

            // Keyboard shortcuts
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey || e.metaKey) {
                    switch (e.key) {
                        case 'f':
                            e.preventDefault();
                            searchBox.focus();
                            break;
                        case 'r':
                            e.preventDefault();
                            this.toggleView();
                            break;
                    }
                }
            });
        }

        toggleView() {
            const activeBtn = document.querySelector('.fv-toggle-btn.active');
            const nextView = activeBtn.dataset.view === 'pretty' ? 'raw' : 'pretty';
            const nextBtn = document.querySelector(`[data-view="${nextView}"]`);

            if (nextBtn) {
                nextBtn.click();
            }
        }

        search(term) {
            this.searchTerm = term;
            // Basic search implementation
            // More sophisticated search with highlighting could be implemented
            console.log('🔍 Searching for:', term);
        }

        getFilename() {
            const url = window.location.href;
            try {
                const pathname = new URL(url).pathname;
                return pathname.split('/').pop() || 'untitled';
            } catch (e) {
                return 'untitled';
            }
        }

        getFileInfo() {
            const size = new Blob([this.originalContent]).size;
            const lines = this.originalContent.split('\n').length;
            return `${this.formatFileSize(size)} • ${lines} lines`;
        }

        formatFileSize(bytes) {
            const units = ['B', 'KB', 'MB', 'GB'];
            let size = bytes;
            let unitIndex = 0;

            while (size >= 1024 && unitIndex < units.length - 1) {
                size /= 1024;
                unitIndex++;
            }

            return `${size.toFixed(1)} ${units[unitIndex]}`;
        }

        injectCSS() {
            // Check if CSS is already injected
            if (document.getElementById('fv-native-styles')) return;

            const link = document.createElement('link');
            link.id = 'fv-native-styles';
            link.rel = 'stylesheet';
            link.href = browser.runtime.getURL('native-viewer.css');
            document.head.appendChild(link);
        }
    }

    // Initialize the native viewer
    const viewer = new NativeViewer();

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => viewer.init());
    } else {
        viewer.init();
    }

    console.log('🦊 Native Multi-Format Viewer loaded');

})();