/**
 * 🦊 Native Multi-Format Viewer - Background Script
 * Download interception and inline content display
 */

console.log('🦊 Native Multi-Format Viewer - Background script loaded');

// Simple settings management
const DEFAULT_SETTINGS = {
    enabled: true,
    autoDetect: true,
    supportedFormats: ['json', 'yaml', 'xml', 'csv', 'toml'],
    theme: 'auto' // auto, light, dark
};

// Supported file types for download interception
const SUPPORTED_TYPES = {
    extensions: new Set(['json', 'yaml', 'yml', 'xml', 'csv', 'toml']),
    mimeTypes: new Set([
        'application/json',
        'application/x-yaml',
        'application/yaml',
        'text/yaml',
        'text/xml',
        'application/xml',
        'text/csv',
        'application/csv',
        'application/toml'
    ])
};

// Download interception patterns
const DOWNLOAD_PATTERNS = [
    /\.(json|yaml|yml|xml|csv|toml)(\?.*)?$/i,
    /\/[^\/]+\.(json|yaml|yml|xml|csv|toml)(\?.*)?$/i
];

// Check if URL should be intercepted
function shouldInterceptUrl(url, responseHeaders = {}) {
    try {
        const urlObj = new URL(url);

        // Check file extension
        const pathname = urlObj.pathname.toLowerCase();
        const extension = pathname.split('.').pop();
        if (SUPPORTED_TYPES.extensions.has(extension)) {
            return { format: extension, reason: 'extension' };
        }

        // Check Content-Type header
        const contentType = responseHeaders['content-type'] || '';
        for (const mimeType of SUPPORTED_TYPES.mimeTypes) {
            if (contentType.includes(mimeType)) {
                const format = mimeType.includes('json') ? 'json' :
                             mimeType.includes('yaml') ? 'yaml' :
                             mimeType.includes('xml') ? 'xml' :
                             mimeType.includes('csv') ? 'csv' :
                             mimeType.includes('toml') ? 'toml' : null;
                if (format) {
                    return { format, reason: 'mime-type' };
                }
            }
        }

        // Check download patterns
        for (const pattern of DOWNLOAD_PATTERNS) {
            if (pattern.test(url)) {
                const match = url.match(/\.(json|yaml|yml|xml|csv|toml)/i);
                if (match) {
                    return { format: match[1].toLowerCase(), reason: 'pattern' };
                }
            }
        }

        return null;
    } catch (error) {
        console.error('🦊 URL interception check failed:', error);
        return null;
    }
}

// Download interception for direct file access
browser.webRequest.onBeforeRequest.addListener(
    async (details) => {
        try {
            const settings = await browser.storage.local.get('settings');
            if (!settings.settings?.enabled) return;

            const detection = shouldInterceptUrl(details.url);
            if (detection && details.type === 'main_frame') {
                console.log('🦊 Intercepting download:', details.url, detection);

                // Create viewer URL with original file URL
                const viewerUrl = browser.runtime.getURL('viewer.html') +
                                '#' + encodeURIComponent(JSON.stringify({
                                    originalUrl: details.url,
                                    format: detection.format,
                                    reason: detection.reason,
                                    timestamp: Date.now()
                                }));

                return { redirectUrl: viewerUrl };
            }
        } catch (error) {
            console.error('🦊 Request interception failed:', error);
        }
    },
    { urls: ['<all_urls>'], types: ['main_frame'] },
    ['blocking']
);

// Enhanced response header checking
browser.webRequest.onHeadersReceived.addListener(
    async (details) => {
        try {
            const settings = await browser.storage.local.get('settings');
            if (!settings.settings?.enabled) return;

            // Convert headers array to object
            const headers = {};
            details.responseHeaders.forEach(header => {
                headers[header.name.toLowerCase()] = header.value;
            });

            const detection = shouldInterceptUrl(details.url, headers);
            if (detection && details.type === 'main_frame') {
                // Check if Content-Disposition suggests download
                const contentDisposition = headers['content-disposition'] || '';
                if (contentDisposition.includes('attachment')) {
                    console.log('🦊 Intercepting attachment download:', details.url, detection);

                    const viewerUrl = browser.runtime.getURL('viewer.html') +
                                    '#' + encodeURIComponent(JSON.stringify({
                                        originalUrl: details.url,
                                        format: detection.format,
                                        reason: 'attachment-' + detection.reason,
                                        timestamp: Date.now(),
                                        headers: headers
                                    }));

                    return { redirectUrl: viewerUrl };
                }
            }
        } catch (error) {
            console.error('🦊 Header interception failed:', error);
        }
    },
    { urls: ['<all_urls>'], types: ['main_frame'] },
    ['blocking', 'responseHeaders']
);

// Initialize settings on install
browser.runtime.onInstalled.addListener(async () => {
    try {
        const result = await browser.storage.local.get('settings');
        if (!result.settings) {
            await browser.storage.local.set({ settings: DEFAULT_SETTINGS });
            console.log('🦊 Default settings initialized');
        }
    } catch (error) {
        console.error('🦊 Settings initialization failed:', error);
    }
});

// Handle messages from content script and viewer
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('🦊 Background: Received message:', request.action);

    // Handle async operations properly
    const handleMessage = async () => {
        try {
            switch (request.action) {
                case 'getSettings':
                    const result = await browser.storage.local.get('settings');
                    return result.settings || DEFAULT_SETTINGS;

                case 'saveSettings':
                    await browser.storage.local.set({ settings: request.settings });
                    return { success: true };

                case 'trackUsage':
                    const stats = await browser.storage.local.get('stats') || {};
                    const currentStats = stats.stats || {};
                    currentStats[request.format] = (currentStats[request.format] || 0) + 1;
                    currentStats.lastUsed = Date.now();
                    await browser.storage.local.set({ stats: currentStats });
                    return { success: true };

                case 'fetchFile':
                    console.log('🦊 Background: Fetching file:', request.url);
                    try {
                        const response = await fetch(request.url, {
                            headers: { 'Accept': '*/*' },
                            mode: 'cors'
                        });

                        console.log('🦊 Background: Fetch response status:', response.status);

                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                        }

                        const content = await response.text();
                        const result = {
                            success: true,
                            content,
                            contentType: response.headers.get('content-type'),
                            size: content.length
                        };

                        console.log('🦊 Background: Fetch successful, size:', result.size);
                        return result;
                    } catch (error) {
                        console.error('🦊 Background: Fetch failed:', error);
                        return {
                            success: false,
                            error: error.message
                        };
                    }

                default:
                    console.log('🦊 Unknown action:', request.action);
                    return { success: false, error: 'Unknown action' };
            }
        } catch (error) {
            console.error('🦊 Message handling failed:', error);
            return { success: false, error: error.message };
        }
    };

    // Execute async handler and send response
    handleMessage().then(response => {
        console.log('🦊 Background: Sending response:', response);
        sendResponse(response);
    }).catch(error => {
        console.error('🦊 Background: Handler error:', error);
        sendResponse({ success: false, error: error.message });
    });

    return true; // Keep message channel open for async response
});

// Export for debugging
if (typeof globalThis !== 'undefined') {
    globalThis.NativeViewerBackground = {
        DEFAULT_SETTINGS,
        SUPPORTED_TYPES,
        shouldInterceptUrl
    };
}

console.log('🦊 Native background script ready with download interception');
console.log('🦊 Supported formats:', Array.from(SUPPORTED_TYPES.extensions));