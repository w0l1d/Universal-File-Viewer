/**
 * 🦊 Native Multi-Format Viewer - Background Script
 * Minimal background script for native-style viewer
 */

console.log('🦊 Native Multi-Format Viewer - Background script loaded');

// Simple settings management
const DEFAULT_SETTINGS = {
    enabled: true,
    autoDetect: true,
    supportedFormats: ['json', 'yaml', 'xml', 'csv', 'toml'],
    theme: 'auto' // auto, light, dark
};

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

// Handle messages from content script
browser.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    try {
        switch (request.action) {
            case 'getSettings':
                const result = await browser.storage.local.get('settings');
                sendResponse(result.settings || DEFAULT_SETTINGS);
                break;

            case 'saveSettings':
                await browser.storage.local.set({ settings: request.settings });
                sendResponse({ success: true });
                break;

            case 'trackUsage':
                // Simple usage tracking
                const stats = await browser.storage.local.get('stats') || {};
                const currentStats = stats.stats || {};
                currentStats[request.format] = (currentStats[request.format] || 0) + 1;
                currentStats.lastUsed = Date.now();
                await browser.storage.local.set({ stats: currentStats });
                break;

            default:
                console.log('🦊 Unknown action:', request.action);
        }
    } catch (error) {
        console.error('🦊 Message handling failed:', error);
        sendResponse({ success: false, error: error.message });
    }

    return true; // Keep message channel open
});

// Optional: Basic file type detection (if needed for future enhancements)
const SUPPORTED_TYPES = {
    extensions: new Set(['json', 'yaml', 'yml', 'xml', 'csv', 'toml', 'txt']),
    mimeTypes: new Set([
        'application/json',
        'application/x-yaml',
        'application/yaml',
        'text/yaml',
        'text/xml',
        'application/xml',
        'text/csv',
        'application/csv',
        'application/toml',
        'text/plain'
    ])
};

// Export for debugging
if (typeof globalThis !== 'undefined') {
    globalThis.NativeViewerBackground = {
        DEFAULT_SETTINGS,
        SUPPORTED_TYPES
    };
}

console.log('🦊 Native background script ready');
console.log('🦊 Supported formats:', Array.from(SUPPORTED_TYPES.extensions));