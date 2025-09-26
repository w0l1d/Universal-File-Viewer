/**
 * 🚀 Revolutionary Background Script - Stream-Based Enhancement System
 * Zero-DOM replacement, pure response stream modification
 */

console.log('🚀 Universal File Viewer - Revolutionary Mode Initializing...');

// Enhanced configuration for the new methodology
const REVOLUTION_CONFIG = {
    // File detection patterns
    supportedExtensions: new Set(['json', 'yaml', 'yml', 'xml', 'csv', 'toml', 'txt', 'md', 'log']),
    supportedMimeTypes: new Set([
        'application/json',
        'application/x-yaml',
        'application/yaml',
        'text/yaml',
        'text/x-yaml',
        'text/xml',
        'application/xml',
        'text/csv',
        'application/csv',
        'text/plain',
        'application/toml',
        'text/toml',
        'text/markdown',
        'text/x-log'
    ]),

    // Enhancement modes
    enhancementModes: {
        PASSIVE: 'passive',           // Visual enhancement only
        INTERACTIVE: 'interactive',   // Click, expand, search
        EDITING: 'editing',          // In-place editing
        STREAMING: 'streaming'       // Progressive loading
    },

    // Performance thresholds
    performance: {
        maxInlineSize: 1024 * 1024,  // 1MB - beyond this, use streaming
        chunkSize: 1024 * 64,        // 64KB chunks for streaming
        maxMemoryUsage: 1024 * 1024 * 50  // 50MB memory limit
    }
};

// Revolutionary file detection system
class RevolutionaryDetector {
    static detectFromUrl(url) {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname.toLowerCase();
            const filename = pathname.split('/').pop();
            const extension = filename.split('.').pop();

            if (REVOLUTION_CONFIG.supportedExtensions.has(extension)) {
                return {
                    format: extension,
                    confidence: 0.9,
                    method: 'url-extension'
                };
            }
        } catch (e) {
            console.log('URL detection failed:', e);
        }
        return null;
    }

    static detectFromMime(contentType) {
        if (!contentType) return null;

        const mimeType = contentType.toLowerCase().split(';')[0].trim();

        if (REVOLUTION_CONFIG.supportedMimeTypes.has(mimeType)) {
            const formatMap = {
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
                'text/markdown': 'md',
                'text/x-log': 'log',
                'text/plain': 'txt'
            };

            return {
                format: formatMap[mimeType] || 'txt',
                confidence: 0.8,
                method: 'mime-type'
            };
        }
        return null;
    }

    static shouldEnhance(url, contentType) {
        const urlDetection = this.detectFromUrl(url);
        const mimeDetection = this.detectFromMime(contentType);

        return urlDetection || mimeDetection;
    }
}

// Response stream enhancement system
class StreamEnhancer {
    static createEnhancementHeaders(detection, originalUrl) {
        const enhancementData = {
            format: detection.format,
            originalUrl: originalUrl,
            enhancementId: `fv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            features: StreamEnhancer.getFormatFeatures(detection.format),
            mode: REVOLUTION_CONFIG.enhancementModes.INTERACTIVE,
            timestamp: Date.now()
        };

        return {
            'X-FileViewer-Enhanced': 'true',
            'X-FileViewer-Data': JSON.stringify(enhancementData),
            'X-FileViewer-Version': '3.0-revolutionary'
        };
    }

    static getFormatFeatures(format) {
        const featureMap = {
            'json': ['syntax-highlighting', 'tree-view', 'collapse', 'search', 'validate'],
            'yaml': ['syntax-highlighting', 'tree-view', 'collapse', 'search', 'validate'],
            'xml': ['syntax-highlighting', 'tree-view', 'collapse', 'search', 'validate'],
            'csv': ['table-view', 'sort', 'filter', 'search', 'export'],
            'md': ['rendered-view', 'syntax-highlighting', 'toc', 'preview'],
            'log': ['syntax-highlighting', 'filter', 'search', 'timestamps'],
            'txt': ['syntax-highlighting', 'search', 'wrap'],
            'toml': ['syntax-highlighting', 'tree-view', 'validate']
        };

        return featureMap[format] || ['syntax-highlighting', 'search'];
    }
}

// Revolutionary request interception - Method 1: Header Enhancement
browser.webRequest.onHeadersReceived.addListener(
    function(details) {
        console.log('🔍 Checking response:', details.url);

        // Get content type from response headers
        let contentType = null;
        const originalHeaders = details.responseHeaders || [];

        for (const header of originalHeaders) {
            if (header.name.toLowerCase() === 'content-type') {
                contentType = header.value;
                break;
            }
        }

        // Check if this file should be enhanced
        const detection = RevolutionaryDetector.shouldEnhance(details.url, contentType);

        if (detection && details.type === 'main_frame') {
            console.log('✨ Enhancing response for:', details.url, 'Format:', detection.format);

            // Create enhanced headers
            const enhancementHeaders = StreamEnhancer.createEnhancementHeaders(detection, details.url);

            // Add enhancement headers to response
            const modifiedHeaders = [...originalHeaders];
            Object.entries(enhancementHeaders).forEach(([name, value]) => {
                modifiedHeaders.push({ name, value });
            });

            // Ensure inline display (prevent download)
            const hasContentDisposition = modifiedHeaders.some(h =>
                h.name.toLowerCase() === 'content-disposition'
            );

            if (!hasContentDisposition) {
                modifiedHeaders.push({
                    name: 'Content-Disposition',
                    value: 'inline'
                });
            }

            // Force no-cache for better development experience
            modifiedHeaders.push({
                name: 'Cache-Control',
                value: 'no-cache, no-store, must-revalidate'
            });

            console.log('📦 Response enhanced with headers:', enhancementHeaders);

            return { responseHeaders: modifiedHeaders };
        }

        return {};
    },
    {
        urls: ["<all_urls>"],
        types: ["main_frame"]
    },
    ["blocking", "responseHeaders"]
);

// Revolutionary request interception - Method 2: Stream Processor
browser.webRequest.onBeforeRequest.addListener(
    function(details) {
        const detection = RevolutionaryDetector.detectFromUrl(details.url);

        if (detection && details.type === 'main_frame') {
            console.log('🌊 Creating stream processor for:', details.url);

            // Create stream processor URL
            const processorUrl = browser.runtime.getURL('stream-processor.html') +
                               '#' + encodeURIComponent(JSON.stringify({
                                   originalUrl: details.url,
                                   detection: detection,
                                   timestamp: Date.now()
                               }));

            console.log('🔄 Redirecting to stream processor:', processorUrl);

            return { redirectUrl: processorUrl };
        }

        return {};
    },
    {
        urls: ["<all_urls>"],
        types: ["main_frame"]
    },
    ["blocking"]
);

// Settings and messaging system
const DEFAULT_SETTINGS = {
    enhancementMode: REVOLUTION_CONFIG.enhancementModes.INTERACTIVE,
    theme: 'auto',
    showLineNumbers: true,
    enableTreeView: true,
    enableSearch: true,
    enableSyntaxHighlighting: true,
    maxFileSize: REVOLUTION_CONFIG.performance.maxInlineSize,
    enableStreaming: true,
    enableWorkerProcessing: true
};

// Initialize settings
browser.runtime.onInstalled.addListener(async () => {
    console.log('🚀 Revolutionary File Viewer installed');

    try {
        const result = await browser.storage.local.get('settings');
        if (!result.settings) {
            await browser.storage.local.set({
                settings: DEFAULT_SETTINGS,
                stats: {
                    installations: Date.now(),
                    version: '3.0-revolutionary'
                }
            });
            console.log('⚙️ Default settings initialized');
        }
    } catch (error) {
        console.error('❌ Settings initialization failed:', error);
    }
});

// Message handling for revolutionary features
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('📨 Message received:', request.action);

    switch (request.action) {
        case 'getSettings':
            handleGetSettings(sendResponse);
            return true;

        case 'saveSettings':
            handleSaveSettings(request.settings, sendResponse);
            return true;

        case 'fetchWithEnhancement':
            handleEnhancedFetch(request, sendResponse);
            return true;

        case 'processLargeFile':
            handleLargeFileProcessing(request, sendResponse);
            return true;

        case 'trackUsage':
            handleUsageTracking(request.format, request.features);
            break;

        case 'getEnhancementData':
            handleGetEnhancementData(request.url, sendResponse);
            return true;

        default:
            console.log('🤷 Unknown action:', request.action);
    }
});

// Settings handlers
async function handleGetSettings(sendResponse) {
    try {
        const result = await browser.storage.local.get('settings');
        sendResponse(result.settings || DEFAULT_SETTINGS);
    } catch (error) {
        console.error('❌ Get settings failed:', error);
        sendResponse(DEFAULT_SETTINGS);
    }
}

async function handleSaveSettings(settings, sendResponse) {
    try {
        await browser.storage.local.set({ settings });
        console.log('💾 Settings saved:', settings);
        sendResponse({ success: true });
    } catch (error) {
        console.error('❌ Save settings failed:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Enhanced fetch with streaming support
async function handleEnhancedFetch(request, sendResponse) {
    try {
        console.log('🌐 Enhanced fetch for:', request.url);

        const response = await fetch(request.url);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentLength = response.headers.get('content-length');
        const contentType = response.headers.get('content-type') || 'text/plain';

        // Check if we should use streaming
        const useStreaming = contentLength &&
                           parseInt(contentLength) > REVOLUTION_CONFIG.performance.maxInlineSize;

        if (useStreaming) {
            console.log('🌊 Using streaming mode for large file');

            const reader = response.body.getReader();
            const chunks = [];
            let totalSize = 0;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                chunks.push(value);
                totalSize += value.length;

                // Send progress updates
                browser.tabs.sendMessage(request.tabId || 0, {
                    action: 'streamProgress',
                    loaded: totalSize,
                    total: parseInt(contentLength) || totalSize
                }).catch(() => {}); // Ignore errors
            }

            const fullBuffer = new Uint8Array(totalSize);
            let offset = 0;
            for (const chunk of chunks) {
                fullBuffer.set(chunk, offset);
                offset += chunk.length;
            }

            const content = new TextDecoder().decode(fullBuffer);

            sendResponse({
                success: true,
                content,
                contentType,
                size: totalSize,
                streaming: true
            });
        } else {
            console.log('📦 Using standard mode for file');

            const content = await response.text();

            sendResponse({
                success: true,
                content,
                contentType,
                size: content.length,
                streaming: false
            });
        }

    } catch (error) {
        console.error('❌ Enhanced fetch failed:', error);
        sendResponse({
            success: false,
            error: error.message
        });
    }
}

// Large file processing with Web Workers
async function handleLargeFileProcessing(request, sendResponse) {
    try {
        console.log('⚙️ Processing large file:', request.format);

        // This would typically spawn a Web Worker for heavy processing
        // For now, we'll simulate async processing

        setTimeout(() => {
            sendResponse({
                success: true,
                processed: true,
                chunks: Math.ceil(request.content.length / REVOLUTION_CONFIG.performance.chunkSize)
            });
        }, 100);

    } catch (error) {
        console.error('❌ Large file processing failed:', error);
        sendResponse({
            success: false,
            error: error.message
        });
    }
}

// Usage tracking for analytics
async function handleUsageTracking(format, features = []) {
    try {
        const result = await browser.storage.local.get('stats');
        const stats = result.stats || {};

        // Track format usage
        if (!stats.formats) stats.formats = {};
        stats.formats[format] = (stats.formats[format] || 0) + 1;

        // Track feature usage
        if (!stats.features) stats.features = {};
        features.forEach(feature => {
            stats.features[feature] = (stats.features[feature] || 0) + 1;
        });

        stats.lastUsed = Date.now();
        stats.totalUsage = (stats.totalUsage || 0) + 1;

        await browser.storage.local.set({ stats });
        console.log('📊 Usage tracked:', format, features);

    } catch (error) {
        console.error('❌ Usage tracking failed:', error);
    }
}

// Get enhancement data for a URL
function handleGetEnhancementData(url, sendResponse) {
    const detection = RevolutionaryDetector.shouldEnhance(url, null);

    if (detection) {
        const enhancementData = {
            format: detection.format,
            features: StreamEnhancer.getFormatFeatures(detection.format),
            mode: REVOLUTION_CONFIG.enhancementModes.INTERACTIVE,
            supported: true
        };

        sendResponse(enhancementData);
    } else {
        sendResponse({ supported: false });
    }
}

// Initialization complete
console.log('🎉 Revolutionary Background Script Ready!');
console.log('📋 Supported formats:', Array.from(REVOLUTION_CONFIG.supportedExtensions));
console.log('🎯 Enhancement modes:', Object.values(REVOLUTION_CONFIG.enhancementModes));