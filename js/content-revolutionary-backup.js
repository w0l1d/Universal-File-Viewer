/**
 * 🚀 Revolutionary Dynamic Injection System
 * Zero-DOM replacement, pure enhancement injection
 *
 * This system detects enhancement headers and progressively enhances
 * the page without destroying the original DOM structure
 */

(() => {
    'use strict';

    console.log('🚀 Revolutionary Injector initializing...');

    // Global state management
    const INJECTOR_STATE = {
        isEnhanced: false,
        enhancementData: null,
        originalContent: null,
        formatDetected: null,
        features: [],
        performance: {
            startTime: Date.now(),
            enhancementTime: null,
            memoryUsage: 0
        }
    };

    /**
     * 🧠 Enhanced Detection System
     */
    class EnhancementDetector {
        static checkForEnhancementSignals() {
            // Method 1: Check for enhancement headers
            const enhancementHeaders = this.parseEnhancementHeaders();
            if (enhancementHeaders) {
                console.log('✨ Enhancement headers detected:', enhancementHeaders);
                return enhancementHeaders;
            }

            // Method 2: Check DOM for enhancement potential
            const domAnalysis = this.analyzeDOMStructure();
            if (domAnalysis.shouldEnhance) {
                console.log('🔍 DOM analysis suggests enhancement:', domAnalysis);
                return {
                    format: domAnalysis.detectedFormat,
                    features: domAnalysis.suggestedFeatures,
                    mode: 'fallback',
                    confidence: domAnalysis.confidence
                };
            }

            return null;
        }

        static parseEnhancementHeaders() {
            // Check if page has enhancement headers
            // This would be set by the background script
            const metaTags = document.querySelectorAll('meta[name^="fv-"]');
            if (metaTags.length > 0) {
                const data = {};
                metaTags.forEach(tag => {
                    const key = tag.name.replace('fv-', '');
                    data[key] = tag.content;
                });
                return data;
            }

            // Check for HTTP headers if available
            try {
                const xhr = new XMLHttpRequest();
                xhr.open('HEAD', window.location.href, false);
                xhr.send();

                const enhancementHeader = xhr.getResponseHeader('X-FileViewer-Data');
                if (enhancementHeader) {
                    return JSON.parse(enhancementHeader);
                }
            } catch (e) {
                // Headers not accessible
            }

            return null;
        }

        static analyzeDOMStructure() {
            const body = document.body;
            const textContent = body.textContent || '';

            // Skip if complex DOM
            if (body.children.length > 3) {
                return { shouldEnhance: false };
            }

            // Skip if no meaningful content
            if (textContent.trim().length < 50) {
                return { shouldEnhance: false };
            }

            // Check for plain text display patterns
            const pre = document.querySelector('pre');
            const isPlainDisplay = (
                body.children.length <= 1 ||
                (body.children.length === 1 && pre && pre.textContent === textContent.trim())
            );

            if (!isPlainDisplay) {
                return { shouldEnhance: false };
            }

            // Detect format from content
            const detection = this.detectFormatFromContent(textContent.trim());

            return {
                shouldEnhance: detection.format !== 'unknown',
                detectedFormat: detection.format,
                suggestedFeatures: detection.features,
                confidence: detection.confidence,
                originalStructure: {
                    hasPreElement: !!pre,
                    bodyChildCount: body.children.length,
                    contentLength: textContent.length
                }
            };
        }

        static detectFormatFromContent(content) {
            const trimmed = content.trim();
            const url = window.location.href.toLowerCase();

            // URL-based detection first (higher confidence)
            const urlFormats = {
                '.json': { format: 'json', confidence: 0.9 },
                '.yaml': { format: 'yaml', confidence: 0.9 },
                '.yml': { format: 'yaml', confidence: 0.9 },
                '.xml': { format: 'xml', confidence: 0.9 },
                '.csv': { format: 'csv', confidence: 0.9 },
                '.toml': { format: 'toml', confidence: 0.9 },
                '.md': { format: 'markdown', confidence: 0.9 },
                '.log': { format: 'log', confidence: 0.8 }
            };

            for (const [ext, data] of Object.entries(urlFormats)) {
                if (url.includes(ext)) {
                    return {
                        ...data,
                        features: this.getFeaturesForFormat(data.format)
                    };
                }
            }

            // Content-based detection (lower confidence)
            const contentPatterns = [
                {
                    test: /^[\s]*[\{\[]/.test(trimmed),
                    verify: () => {
                        try { JSON.parse(trimmed); return true; }
                        catch { return false; }
                    },
                    format: 'json',
                    confidence: 0.8
                },
                {
                    test: /^---/.test(trimmed) || /^[a-zA-Z0-9_-]+\s*:/.test(trimmed),
                    verify: () => trimmed.includes(':') && !trimmed.startsWith('<'),
                    format: 'yaml',
                    confidence: 0.7
                },
                {
                    test: /^<\?xml|^<[a-zA-Z]/.test(trimmed),
                    verify: () => trimmed.includes('<') && trimmed.includes('>'),
                    format: 'xml',
                    confidence: 0.7
                },
                {
                    test: /,.*\n.*,/.test(trimmed) || /^[^,\n]+,[^,\n]+/.test(trimmed),
                    verify: () => (trimmed.match(/,/g) || []).length > 2,
                    format: 'csv',
                    confidence: 0.6
                }
            ];

            for (const pattern of contentPatterns) {
                if (pattern.test && pattern.verify()) {
                    return {
                        format: pattern.format,
                        confidence: pattern.confidence,
                        features: this.getFeaturesForFormat(pattern.format)
                    };
                }
            }

            return {
                format: 'unknown',
                confidence: 0,
                features: []
            };
        }

        static getFeaturesForFormat(format) {
            const featureMap = {
                'json': ['syntax-highlighting', 'tree-view', 'collapse', 'search', 'validate', 'format'],
                'yaml': ['syntax-highlighting', 'tree-view', 'collapse', 'search', 'validate', 'format'],
                'xml': ['syntax-highlighting', 'tree-view', 'collapse', 'search', 'validate', 'format'],
                'csv': ['table-view', 'sort', 'filter', 'search', 'export'],
                'markdown': ['rendered-view', 'syntax-highlighting', 'toc', 'preview'],
                'log': ['syntax-highlighting', 'filter', 'search', 'timestamps', 'levels'],
                'toml': ['syntax-highlighting', 'tree-view', 'validate', 'format'],
                'text': ['syntax-highlighting', 'search', 'wrap']
            };

            return featureMap[format] || ['syntax-highlighting', 'search'];
        }
    }

    /**
     * 🎨 Progressive Enhancement Engine
     */
    class ProgressiveEnhancer {
        constructor(enhancementData) {
            this.data = enhancementData;
            this.injectionPoints = [];
            this.styleInjected = false;
            this.controlsInjected = false;

            console.log('🎨 Progressive Enhancer initialized:', this.data);
        }

        async enhance() {
            try {
                console.log('✨ Starting progressive enhancement...');

                // Phase 1: Preserve original content
                this.preserveOriginalState();

                // Phase 2: Inject base styles
                await this.injectEnhancementStyles();

                // Phase 3: Create enhancement overlay
                this.createEnhancementOverlay();

                // Phase 4: Apply progressive formatting
                await this.applyProgressiveFormatting();

                // Phase 5: Inject interactive controls
                this.injectInteractiveControls();

                // Phase 6: Set up event handlers
                this.setupEventHandlers();

                INJECTOR_STATE.isEnhanced = true;
                INJECTOR_STATE.performance.enhancementTime = Date.now() - INJECTOR_STATE.performance.startTime;

                console.log('🎉 Enhancement complete!', INJECTOR_STATE.performance);

            } catch (error) {
                console.error('❌ Enhancement failed:', error);
                this.handleEnhancementError(error);
            }
        }

        preserveOriginalState() {
            INJECTOR_STATE.originalContent = {
                html: document.body.innerHTML,
                textContent: document.body.textContent,
                title: document.title,
                url: window.location.href
            };

            console.log('💾 Original state preserved');
        }

        async injectEnhancementStyles() {
            if (this.styleInjected) return;

            const styleId = 'fv-revolutionary-styles';
            if (document.getElementById(styleId)) return;

            console.log('💄 Injecting enhancement styles...');

            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = this.getEnhancementStyles();
            document.head.appendChild(style);

            this.styleInjected = true;
            console.log('✅ Styles injected successfully');
        }

        createEnhancementOverlay() {
            const overlay = document.createElement('div');
            overlay.className = 'fv-enhancement-overlay';
            overlay.id = 'fv-enhancement-overlay';

            overlay.innerHTML = `
                <div class="fv-enhancement-banner">
                    <div class="fv-banner-content">
                        <div class="fv-banner-info">
                            <div class="fv-format-indicator">
                                <span class="fv-format-badge">${this.data.format?.toUpperCase() || 'FILE'}</span>
                                <span class="fv-filename">${this.getFileName()}</span>
                            </div>
                            <div class="fv-enhancement-status">
                                <span class="fv-status-text">Enhanced by Universal File Viewer</span>
                                <div class="fv-feature-badges">
                                    ${(this.data.features || []).map(f =>
                                        `<span class="fv-feature-badge">${f}</span>`
                                    ).join('')}
                                </div>
                            </div>
                        </div>
                        <div class="fv-banner-controls">
                            <button class="fv-control-btn" id="fv-toggle-theme" title="Toggle theme">🎨</button>
                            <button class="fv-control-btn" id="fv-copy-content" title="Copy content">📋</button>
                            <button class="fv-control-btn" id="fv-download-file" title="Download">💾</button>
                            <button class="fv-control-btn fv-control-primary" id="fv-show-original" title="Show original">⏮️</button>
                        </div>
                    </div>
                </div>
            `;

            // Insert at the top of the page
            document.body.insertBefore(overlay, document.body.firstChild);

            // Add slide-down animation
            setTimeout(() => {
                overlay.classList.add('fv-active');
            }, 100);

            console.log('🎭 Enhancement overlay created');
        }

        async applyProgressiveFormatting() {
            const content = INJECTOR_STATE.originalContent.textContent.trim();
            const format = this.data.format;

            console.log('🔄 Applying progressive formatting for:', format);

            // Find the content element to enhance
            const pre = document.querySelector('pre');
            const contentElement = pre || document.body;

            // Create enhanced content container
            const enhancedContainer = document.createElement('div');
            enhancedContainer.className = 'fv-enhanced-content';
            enhancedContainer.id = 'fv-enhanced-content';

            // Format the content based on type
            let formattedContent = content;
            let highlightedContent = '';

            try {
                // Apply format-specific processing
                formattedContent = await this.formatContent(content, format);
                highlightedContent = this.applySyntaxHighlighting(formattedContent, format);

                enhancedContainer.innerHTML = `
                    <div class="fv-content-header">
                        <div class="fv-content-info">
                            <span class="fv-line-count">${formattedContent.split('\\n').length} lines</span>
                            <span class="fv-size-info">${this.formatFileSize(new Blob([content]).size)}</span>
                        </div>
                        <div class="fv-view-controls">
                            <button class="fv-view-btn fv-active" data-view="enhanced">✨ Enhanced</button>
                            <button class="fv-view-btn" data-view="raw">📄 Raw</button>
                        </div>
                    </div>
                    <div class="fv-content-display">
                        <pre class="fv-enhanced-pre"><code class="fv-enhanced-code">${highlightedContent}</code></pre>
                    </div>
                `;

                // Replace or enhance existing content
                if (pre) {
                    pre.style.display = 'none';
                    pre.parentNode.insertBefore(enhancedContainer, pre.nextSibling);
                } else {
                    // Create wrapper and move original content
                    const originalWrapper = document.createElement('div');
                    originalWrapper.style.display = 'none';
                    originalWrapper.id = 'fv-original-content';
                    originalWrapper.innerHTML = document.body.innerHTML;

                    document.body.innerHTML = '';
                    document.body.appendChild(document.getElementById('fv-enhancement-overlay'));
                    document.body.appendChild(enhancedContainer);
                    document.body.appendChild(originalWrapper);
                }

                console.log('✅ Progressive formatting applied');

            } catch (error) {
                console.error('❌ Formatting failed:', error);
                enhancedContainer.innerHTML = `
                    <div class="fv-error-message">
                        <h3>⚠️ Enhancement Error</h3>
                        <p>Failed to format content: ${error.message}</p>
                        <button onclick="document.getElementById('fv-show-original').click()">Show Original</button>
                    </div>
                `;
            }
        }

        async formatContent(content, format) {
            switch (format) {
                case 'json':
                    try {
                        const parsed = JSON.parse(content);
                        return JSON.stringify(parsed, null, 2);
                    } catch (e) {
                        return content;
                    }

                case 'yaml':
                    // Would use jsyaml if available
                    return content;

                case 'xml':
                    return this.formatXML(content);

                default:
                    return content;
            }
        }

        formatXML(xml) {
            try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(xml, 'application/xml');
                const serializer = new XMLSerializer();
                return serializer.serializeToString(doc);
            } catch (e) {
                return xml;
            }
        }

        applySyntaxHighlighting(content, format) {
            let highlighted = this.escapeHtml(content);

            switch (format) {
                case 'json':
                    highlighted = this.highlightJSON(highlighted);
                    break;
                case 'yaml':
                    highlighted = this.highlightYAML(highlighted);
                    break;
                case 'xml':
                    highlighted = this.highlightXML(highlighted);
                    break;
            }

            return highlighted;
        }

        highlightJSON(html) {
            // Apply JSON-specific highlighting
            html = html.replace(/"([^"\\\\]*(\\\\.[^"\\\\]*)*)"/g, '<span class="fv-json-string">"$1"</span>');
            html = html.replace(/:\s*(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g, ': <span class="fv-json-number">$1</span>');
            html = html.replace(/:\s*(true|false)/g, ': <span class="fv-json-boolean">$1</span>');
            html = html.replace(/:\s*(null)/g, ': <span class="fv-json-null">$1</span>');
            return html;
        }

        highlightYAML(html) {
            // Apply YAML-specific highlighting
            html = html.replace(/^(\s*)([a-zA-Z0-9_-]+):/gm, '$1<span class="fv-yaml-key">$2</span>:');
            html = html.replace(/:\s*"([^"]*)"/g, ': <span class="fv-yaml-string">"$1"</span>');
            html = html.replace(/:\s*(-?\d+(?:\.\d+)?)/g, ': <span class="fv-yaml-number">$1</span>');
            html = html.replace(/:\s*(true|false)/gi, ': <span class="fv-yaml-boolean">$1</span>');
            return html;
        }

        highlightXML(html) {
            // Apply XML-specific highlighting
            html = html.replace(/&lt;(\/?[a-zA-Z0-9_-]+)/g, '&lt;<span class="fv-xml-tag">$1</span>');
            html = html.replace(/([a-zA-Z0-9_-]+)=["']([^"']*?)["']/g, '<span class="fv-xml-attr">$1</span>=<span class="fv-xml-value">"$2"</span>');
            return html;
        }

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        setupEventHandlers() {
            console.log('🔧 Setting up event handlers...');

            // Theme toggle
            document.getElementById('fv-toggle-theme')?.addEventListener('click', () => {
                this.toggleTheme();
            });

            // Copy content
            document.getElementById('fv-copy-content')?.addEventListener('click', () => {
                this.copyContent();
            });

            // Download file
            document.getElementById('fv-download-file')?.addEventListener('click', () => {
                this.downloadFile();
            });

            // Show original
            document.getElementById('fv-show-original')?.addEventListener('click', () => {
                this.toggleOriginalView();
            });

            // View toggles
            document.querySelectorAll('.fv-view-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    this.switchView(e.target.dataset.view);
                });
            });

            console.log('✅ Event handlers ready');
        }

        toggleTheme() {
            const body = document.body;
            body.classList.toggle('fv-dark-theme');

            const isDark = body.classList.contains('fv-dark-theme');
            console.log('🎨 Theme toggled to:', isDark ? 'dark' : 'light');
        }

        async copyContent() {
            try {
                const content = INJECTOR_STATE.originalContent.textContent;
                await navigator.clipboard.writeText(content);
                this.showToast('Content copied to clipboard!');
            } catch (error) {
                console.error('❌ Copy failed:', error);
                this.showToast('Copy failed: ' + error.message);
            }
        }

        downloadFile() {
            const content = INJECTOR_STATE.originalContent.textContent;
            const filename = this.getFileName();

            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `enhanced_${filename}`;
            a.click();

            URL.revokeObjectURL(url);
            this.showToast('File downloaded!');
        }

        toggleOriginalView() {
            const enhanced = document.getElementById('fv-enhanced-content');
            const original = document.getElementById('fv-original-content');
            const overlay = document.getElementById('fv-enhancement-overlay');

            if (enhanced && enhanced.style.display !== 'none') {
                enhanced.style.display = 'none';
                overlay.style.display = 'none';
                if (original) original.style.display = 'block';
                else document.querySelector('pre')?.style.setProperty('display', 'block');
            } else {
                enhanced.style.display = 'block';
                overlay.style.display = 'block';
                if (original) original.style.display = 'none';
                else document.querySelector('pre')?.style.setProperty('display', 'none');
            }
        }

        switchView(view) {
            document.querySelectorAll('.fv-view-btn').forEach(btn => {
                btn.classList.remove('fv-active');
            });

            document.querySelector(`[data-view="${view}"]`).classList.add('fv-active');

            const codeElement = document.querySelector('.fv-enhanced-code');

            switch (view) {
                case 'raw':
                    codeElement.textContent = INJECTOR_STATE.originalContent.textContent;
                    break;
                case 'enhanced':
                    // Re-apply highlighting
                    const highlighted = this.applySyntaxHighlighting(
                        INJECTOR_STATE.originalContent.textContent,
                        this.data.format
                    );
                    codeElement.innerHTML = highlighted;
                    break;
            }
        }

        showToast(message) {
            const toast = document.createElement('div');
            toast.className = 'fv-toast';
            toast.textContent = message;
            document.body.appendChild(toast);

            setTimeout(() => toast.classList.add('fv-show'), 100);
            setTimeout(() => {
                toast.classList.remove('fv-show');
                setTimeout(() => toast.remove(), 300);
            }, 3000);

            console.log('🍞 Toast:', message);
        }

        getFileName() {
            const url = window.location.href;
            const pathname = new URL(url).pathname;
            return pathname.split('/').pop() || 'untitled';
        }

        formatFileSize(bytes) {
            const units = ['B', 'KB', 'MB', 'GB'];
            let size = bytes;
            let unitIndex = 0;

            while (size >= 1024 && unitIndex < units.length - 1) {
                size /= 1024;
                unitIndex++;
            }

            return `${size.toFixed(2)} ${units[unitIndex]}`;
        }

        getEnhancementStyles() {
            return `
                /* 🚀 Revolutionary Enhancement Styles */
                .fv-enhancement-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    z-index: 10000;
                    transform: translateY(-100%);
                    transition: transform 0.3s ease;
                }

                .fv-enhancement-overlay.fv-active {
                    transform: translateY(0);
                }

                .fv-enhancement-banner {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 12px 24px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }

                .fv-banner-content {
                    max-width: 1200px;
                    margin: 0 auto;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 16px;
                }

                .fv-banner-info {
                    display: flex;
                    align-items: center;
                    gap: 24px;
                    flex: 1;
                }

                .fv-format-indicator {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .fv-format-badge {
                    background: rgba(255,255,255,0.2);
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 600;
                    text-transform: uppercase;
                }

                .fv-filename {
                    font-weight: 500;
                    font-size: 16px;
                }

                .fv-enhancement-status {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .fv-status-text {
                    font-size: 13px;
                    opacity: 0.9;
                }

                .fv-feature-badges {
                    display: flex;
                    gap: 6px;
                    flex-wrap: wrap;
                }

                .fv-feature-badge {
                    background: rgba(255,255,255,0.15);
                    padding: 2px 6px;
                    border-radius: 8px;
                    font-size: 10px;
                    text-transform: capitalize;
                }

                .fv-banner-controls {
                    display: flex;
                    gap: 8px;
                }

                .fv-control-btn {
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.2);
                    color: white;
                    padding: 8px 12px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.2s ease;
                }

                .fv-control-btn:hover {
                    background: rgba(255,255,255,0.2);
                    transform: translateY(-1px);
                }

                .fv-control-primary {
                    background: rgba(255,255,255,0.9);
                    color: #764ba2;
                }

                .fv-enhanced-content {
                    margin-top: 60px;
                    background: white;
                    min-height: calc(100vh - 60px);
                }

                .fv-content-header {
                    background: #f8fafc;
                    border-bottom: 1px solid #e2e8f0;
                    padding: 16px 24px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .fv-content-info {
                    display: flex;
                    gap: 20px;
                    color: #64748b;
                    font-size: 14px;
                }

                .fv-view-controls {
                    display: flex;
                    gap: 8px;
                }

                .fv-view-btn {
                    padding: 6px 12px;
                    border: 1px solid #e2e8f0;
                    background: white;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                    transition: all 0.2s ease;
                }

                .fv-view-btn.fv-active {
                    background: #667eea;
                    color: white;
                    border-color: #667eea;
                }

                .fv-content-display {
                    padding: 24px;
                }

                .fv-enhanced-pre {
                    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Consolas', monospace;
                    font-size: 14px;
                    line-height: 1.6;
                    margin: 0;
                    overflow-x: auto;
                    background: #fafbfc;
                    padding: 20px;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                }

                .fv-enhanced-code {
                    font-family: inherit;
                }

                /* Syntax Highlighting */
                .fv-json-string { color: #032f62; font-weight: 500; }
                .fv-json-number { color: #005cc5; }
                .fv-json-boolean { color: #d73a49; font-weight: 600; }
                .fv-json-null { color: #6f42c1; font-style: italic; }

                .fv-yaml-key { color: #22863a; font-weight: 600; }
                .fv-yaml-string { color: #032f62; }
                .fv-yaml-number { color: #005cc5; }
                .fv-yaml-boolean { color: #d73a49; font-weight: 600; }

                .fv-xml-tag { color: #22863a; font-weight: 600; }
                .fv-xml-attr { color: #6f42c1; }
                .fv-xml-value { color: #032f62; }

                /* Toast Notifications */
                .fv-toast {
                    position: fixed;
                    bottom: 24px;
                    right: 24px;
                    background: #2d3748;
                    color: white;
                    padding: 12px 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    transform: translateY(100px);
                    opacity: 0;
                    transition: all 0.3s ease;
                    z-index: 10001;
                }

                .fv-toast.fv-show {
                    transform: translateY(0);
                    opacity: 1;
                }

                /* Dark Theme */
                body.fv-dark-theme .fv-enhanced-content {
                    background: #1a202c;
                    color: #f7fafc;
                }

                body.fv-dark-theme .fv-content-header {
                    background: #2d3748;
                    border-bottom-color: #4a5568;
                    color: #f7fafc;
                }

                body.fv-dark-theme .fv-enhanced-pre {
                    background: #2d3748;
                    border-color: #4a5568;
                    color: #f7fafc;
                }

                body.fv-dark-theme .fv-view-btn {
                    background: #374151;
                    border-color: #4a5568;
                    color: #f7fafc;
                }

                /* Responsive Design */
                @media (max-width: 768px) {
                    .fv-banner-content {
                        flex-direction: column;
                        text-align: center;
                    }

                    .fv-content-header {
                        flex-direction: column;
                        gap: 12px;
                    }

                    .fv-enhanced-pre {
                        font-size: 12px;
                        padding: 16px;
                    }
                }
            `;
        }

        handleEnhancementError(error) {
            const errorOverlay = document.createElement('div');
            errorOverlay.className = 'fv-error-overlay';
            errorOverlay.innerHTML = `
                <div class="fv-error-content">
                    <h3>⚠️ Enhancement Failed</h3>
                    <p>${error.message}</p>
                    <button onclick="location.reload()">Reload Page</button>
                </div>
            `;
            document.body.appendChild(errorOverlay);
        }
    }

    /**
     * 🚀 Main Initialization Logic
     */
    async function initializeRevolutionaryInjector() {
        try {
            console.log('🔍 Checking for enhancement signals...');

            // Check if enhancement is needed
            const enhancementData = EnhancementDetector.checkForEnhancementSignals();

            if (!enhancementData) {
                console.log('ℹ️ No enhancement needed for this page');
                return;
            }

            console.log('✨ Enhancement data found:', enhancementData);

            // Store enhancement data globally
            INJECTOR_STATE.enhancementData = enhancementData;
            INJECTOR_STATE.formatDetected = enhancementData.format;
            INJECTOR_STATE.features = enhancementData.features || [];

            // Create progressive enhancer
            const enhancer = new ProgressiveEnhancer(enhancementData);

            // Start enhancement process
            await enhancer.enhance();

            console.log('🎉 Revolutionary injection complete!');

        } catch (error) {
            console.error('❌ Revolutionary injector failed:', error);
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeRevolutionaryInjector);
    } else {
        // Small delay to let other scripts load
        setTimeout(initializeRevolutionaryInjector, 100);
    }

    // Export for debugging
    window.FV_REVOLUTIONARY = {
        INJECTOR_STATE,
        EnhancementDetector,
        ProgressiveEnhancer,
        reinitialize: initializeRevolutionaryInjector
    };

    console.log('🚀 Revolutionary Dynamic Injector loaded successfully');

})();