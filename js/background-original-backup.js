/**
 * Background script for File Viewer extension
 * Handles extension-wide functionality and settings
 */

// Default settings
const DEFAULT_SETTINGS = {
    theme: 'auto', // auto, dark, light
    showLineNumbers: true,
    sortKeys: false,
    indentSize: 2,
    autoFormat: true,
    maxFileSize: 10,
    enableCache: true,
    customFormats: {},
    extensionMappings: {}
};

// Initialize settings on install
browser.runtime.onInstalled.addListener(() => {
    browser.storage.local.get('settings').then(result => {
        if (!result.settings) {
            browser.storage.local.set({ settings: DEFAULT_SETTINGS });
        }
    });
});

// Handle messages from content scripts
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'getSettings':
            browser.storage.local.get('settings').then(result => {
                sendResponse(result.settings || DEFAULT_SETTINGS);
            });
            return true; // Keep message channel open for async response

        case 'saveSettings':
            browser.storage.local.set({ settings: request.settings }).then(() => {
                sendResponse({ success: true });
            });
            return true;

        case 'trackUsage':
            trackUsage(request.format);
            break;

        case 'getCustomFormats':
            browser.storage.local.get('settings').then(result => {
                const settings = result.settings || DEFAULT_SETTINGS;
                sendResponse({
                    customFormats: settings.customFormats || {},
                    extensionMappings: settings.extensionMappings || {}
                });
            });
            return true;
    }
});

// Track usage statistics
function trackUsage(format) {
    browser.storage.local.get('stats').then(result => {
        const stats = result.stats || {};
        stats[format] = (stats[format] || 0) + 1;
        stats.lastUsed = new Date().toISOString();
        browser.storage.local.set({ stats });
    });
}

// Supported file extensions that should be displayed inline
const SUPPORTED_EXTENSIONS = ['json', 'yaml', 'yml', 'xml', 'csv', 'toml', 'txt'];

// Supported MIME types that should be displayed inline
const SUPPORTED_MIME_TYPES = [
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
    'text/toml'
];

// Check if URL has a supported file extension
function hasSupportedExtension(url) {
    try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname.toLowerCase();
        const segments = pathname.split('/');
        const filename = segments[segments.length - 1];
        const dotIndex = filename.lastIndexOf('.');

        if (dotIndex > 0 && dotIndex < filename.length - 1) {
            const extension = filename.substring(dotIndex + 1);
            return SUPPORTED_EXTENSIONS.includes(extension);
        }
    } catch (e) {
        // Ignore URL parsing errors
    }
    return false;
}

// Check if MIME type is supported
function hasSupportedMimeType(contentType) {
    if (!contentType) return false;
    const mimeType = contentType.toLowerCase().split(';')[0].trim();
    return SUPPORTED_MIME_TYPES.includes(mimeType);
}

// Early interception to redirect supported files to a viewer page
browser.webRequest.onBeforeRequest.addListener(
    function(details) {
        const hasExtension = hasSupportedExtension(details.url);

        if (hasExtension && details.type === "main_frame") {
            console.log('File Viewer: Redirecting supported file to viewer:', details.url);

            // Create a data URL that will display the content
            const encodedUrl = encodeURIComponent(details.url);
            const viewerUrl = browser.runtime.getURL(`viewer.html?url=${encodedUrl}`);

            return { redirectUrl: viewerUrl };
        }
    },
    {
        urls: ["<all_urls>"],
        types: ["main_frame"]
    },
    ["blocking"]
);

// Intercept headers to prevent downloads and force inline display
browser.webRequest.onHeadersReceived.addListener(
    function(details) {
        let headers = details.responseHeaders;
        let modified = false;

        // Check if this is a file we want to handle
        const hasExtension = hasSupportedExtension(details.url);
        let hasMimeType = false;

        // Find content-type header
        let contentTypeHeader = null;
        for (let header of headers) {
            if (header.name.toLowerCase() === 'content-type') {
                contentTypeHeader = header;
                hasMimeType = hasSupportedMimeType(header.value);
                break;
            }
        }

        // Only modify headers for files we can handle
        if (hasExtension || hasMimeType) {
            console.log('File Viewer: Intercepting headers for', details.url);
            console.log('File Viewer: Original headers:', headers.map(h => `${h.name}: ${h.value}`));

            // Remove any existing content-disposition headers and force inline
            headers = headers.filter(header => header.name.toLowerCase() !== 'content-disposition');
            headers.push({
                name: 'Content-Disposition',
                value: 'inline; filename="' + details.url.split('/').pop().split('?')[0] + '"'
            });
            modified = true;
            console.log('File Viewer: Forced content-disposition to inline');

            // Remove any cache-control headers that might interfere
            headers = headers.filter(header => header.name.toLowerCase() !== 'cache-control');
            headers.push({
                name: 'Cache-Control',
                value: 'no-cache, no-store'
            });
            modified = true;

            // Ensure proper content-type for supported files
            if (hasExtension && !hasMimeType) {
                const url = details.url.toLowerCase();
                let mimeType = null;

                if (url.includes('.yaml') || url.includes('.yml')) {
                    mimeType = 'application/x-yaml';
                } else if (url.includes('.json')) {
                    mimeType = 'application/json';
                } else if (url.includes('.xml')) {
                    mimeType = 'text/xml';
                } else if (url.includes('.csv')) {
                    mimeType = 'text/csv';
                } else if (url.includes('.toml')) {
                    mimeType = 'application/toml';
                }

                if (mimeType) {
                    if (contentTypeHeader) {
                        contentTypeHeader.value = mimeType;
                    } else {
                        headers.push({
                            name: 'Content-Type',
                            value: mimeType
                        });
                    }
                    modified = true;
                    console.log('File Viewer: Set content-type to', mimeType);
                }
            }
        }

        if (modified) {
            console.log('File Viewer: Modified headers:', headers.map(h => `${h.name}: ${h.value}`));
        }

        return modified ? { responseHeaders: headers } : {};
    },
    {
        urls: ["<all_urls>"],
        types: ["main_frame"]
    },
    ["blocking", "responseHeaders"]
);

// Add debugging for when the extension starts
console.log('File Viewer: Background script loaded, webRequest listeners registered');