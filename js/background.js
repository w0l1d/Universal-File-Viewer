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

        // First priority: Check Content-Type header (most reliable)
        const contentType = responseHeaders['content-type'] || '';
        if (contentType) {
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
        }

        // Second priority: Check file extension
        const pathname = urlObj.pathname.toLowerCase();
        // Extract extension properly - only get the part after the last dot
        const lastDotIndex = pathname.lastIndexOf('.');
        if (lastDotIndex > -1) {
            const extension = pathname.substring(lastDotIndex + 1);
            // Remove query parameters if present
            const cleanExtension = extension.split('?')[0].split('#')[0];
            if (SUPPORTED_TYPES.extensions.has(cleanExtension)) {
                return { format: cleanExtension, reason: 'extension' };
            }
        }

        // Third priority: Check download patterns
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
            // Default to enabled if settings don't exist yet
            const isEnabled = settings.settings?.enabled !== false;

            if (!isEnabled) return;

            const detection = shouldInterceptUrl(details.url);
            if (detection && details.type === 'main_frame') {
                console.log('🦊 Intercepting download:', details.url, detection);

                // Try to fetch the content immediately during interception
                try {
                    console.log('🦊 Pre-fetching content during interception...');
                    const response = await fetch(details.url, {
                        headers: { 'Accept': '*/*' },
                        mode: 'cors'
                    });

                    if (response.ok) {
                        const content = await response.text();
                        const contentType = response.headers.get('content-type');

                        // Extract all response headers
                        const responseHeaders = {};
                        response.headers.forEach((value, name) => {
                            responseHeaders[name.toLowerCase()] = value;
                        });

                        console.log('🦊 Pre-fetch successful, size:', content.length);
                        console.log('🦊 Response headers:', responseHeaders);

                        // Store the fetched content temporarily
                        const cacheKey = `content_${Date.now()}`;
                        await browser.storage.local.set({
                            [cacheKey]: {
                                content,
                                contentType,
                                size: content.length,
                                timestamp: Date.now(),
                                headers: responseHeaders
                            }
                        });

                        // Create viewer URL with cached content reference
                        const viewerUrl = browser.runtime.getURL('viewer.html') +
                                        '#' + encodeURIComponent(JSON.stringify({
                                            originalUrl: details.url,
                                            format: detection.format,
                                            reason: detection.reason,
                                            timestamp: Date.now(),
                                            cacheKey: cacheKey
                                        }));

                        console.log('🦊 Generated viewer URL with cached content:', viewerUrl);
                        return { redirectUrl: viewerUrl };
                    }
                } catch (fetchError) {
                    console.error('🦊 Pre-fetch failed, falling back to direct fetch:', fetchError);
                }

                // Fallback to original approach if pre-fetch fails
                const viewerUrl = browser.runtime.getURL('viewer.html') +
                                '#' + encodeURIComponent(JSON.stringify({
                                    originalUrl: details.url,
                                    format: detection.format,
                                    reason: detection.reason,
                                    timestamp: Date.now()
                                }));

                console.log('🦊 Generated viewer URL:', viewerUrl);
                return { redirectUrl: viewerUrl };
            }
        } catch (error) {
            console.error('🦊 Request interception failed:', error);
        }
    },
    { urls: ['<all_urls>'], types: ['main_frame'] },
    ['blocking']
);

// Global settings cache to avoid async in blocking listener
let cachedSettings = { enabled: true }; // Default to enabled

// Enhanced response header checking - PRIMARY INTERCEPTION METHOD
browser.webRequest.onHeadersReceived.addListener(
    (details) => {
        try {
            console.log('🦊 onHeadersReceived triggered for:', details.url, 'type:', details.type);
            console.log('🦊 Extension enabled:', cachedSettings.enabled);

            if (!cachedSettings.enabled) {
                console.log('🦊 Extension disabled, skipping interception');
                return;
            }

            // Convert headers array to object
            const headers = {};
            details.responseHeaders.forEach(header => {
                headers[header.name.toLowerCase()] = header.value;
            });

            console.log('🦊 Content-Type header:', headers['content-type']);

            const detection = shouldInterceptUrl(details.url, headers);
            console.log('🦊 Detection result:', detection);

            if (detection && details.type === 'main_frame') {
                console.log('🦊 ✅ Intercepting:', details.url, detection);

                // Create viewer URL without pre-fetching (can't do async in blocking listener)
                const viewerUrl = browser.runtime.getURL('viewer.html') +
                                '#' + encodeURIComponent(JSON.stringify({
                                    originalUrl: details.url,
                                    format: detection.format,
                                    reason: detection.reason,
                                    timestamp: Date.now(),
                                    headers: headers
                                }));

                console.log('🦊 Redirecting to viewer:', viewerUrl);
                return { redirectUrl: viewerUrl };
            }
        } catch (error) {
            console.error('🦊 Header interception failed:', error);
        }
    },
    { urls: ['<all_urls>'], types: ['main_frame'] },
    ['blocking', 'responseHeaders']
);

// Initialize settings on install and update cache
browser.runtime.onInstalled.addListener(async () => {
    try {
        const result = await browser.storage.local.get('settings');
        if (!result.settings) {
            await browser.storage.local.set({ settings: DEFAULT_SETTINGS });
            cachedSettings = DEFAULT_SETTINGS;
            console.log('🦊 Default settings initialized');
        } else {
            cachedSettings = result.settings;
        }
    } catch (error) {
        console.error('🦊 Settings initialization failed:', error);
    }
});

// Load settings on startup and keep cache updated
browser.storage.local.get('settings').then(result => {
    if (result.settings) {
        cachedSettings = result.settings;
        console.log('🦊 Settings loaded from storage:', cachedSettings);
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
                    cachedSettings = request.settings; // Update cache
                    console.log('🦊 Settings saved and cache updated:', cachedSettings);
                    return { success: true };

                case 'trackUsage':
                    const stats = await browser.storage.local.get('stats') || {};
                    const currentStats = stats.stats || {};
                    currentStats[request.format] = (currentStats[request.format] || 0) + 1;
                    currentStats.lastUsed = Date.now();
                    await browser.storage.local.set({ stats: currentStats });
                    return { success: true };

                case 'getCachedContent':
                    console.log('🦊 Background: Getting cached content:', request.cacheKey);
                    try {
                        const result = await browser.storage.local.get(request.cacheKey);
                        const cachedData = result[request.cacheKey];

                        if (cachedData) {
                            console.log('🦊 Background: Cached content found, size:', cachedData.size);

                            // Clean up old cached content (older than 5 minutes)
                            const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
                            if (cachedData.timestamp < fiveMinutesAgo) {
                                browser.storage.local.remove(request.cacheKey);
                            }

                            return {
                                success: true,
                                content: cachedData.content,
                                contentType: cachedData.contentType,
                                size: cachedData.size,
                                headers: cachedData.headers || {}
                            };
                        } else {
                            throw new Error('Cached content not found or expired');
                        }
                    } catch (error) {
                        console.error('🦊 Background: Cache retrieval failed:', error);
                        return {
                            success: false,
                            error: error.message
                        };
                    }

                case 'fetchFile':
                    console.log('🦊 Background: Fetching file:', request.url);
                    try {
                        const response = await fetch(request.url, {
                            headers: { 'Accept': '*/*' },
                            mode: 'cors'
                        });

                        console.log('🦊 Background: Fetch response status:', response.status);

                        // Extract all response headers (for both success and error)
                        const responseHeaders = {};
                        response.headers.forEach((value, name) => {
                            responseHeaders[name.toLowerCase()] = value;
                        });
                        console.log('🦊 Background: Response headers:', responseHeaders);

                        if (!response.ok) {
                            // Capture headers even for error responses
                            return {
                                success: false,
                                error: `HTTP ${response.status}: ${response.statusText}`,
                                status: response.status,
                                statusText: response.statusText,
                                headers: responseHeaders
                            };
                        }

                        const content = await response.text();
                        const result = {
                            success: true,
                            content,
                            contentType: response.headers.get('content-type'),
                            size: content.length,
                            headers: responseHeaders
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