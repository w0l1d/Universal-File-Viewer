/**
 * Simple popup settings handler - completely rewritten for reliability
 */

// Default settings
const DEFAULT_SETTINGS = {
    theme: 'auto',
    showLineNumbers: true,
    sortKeys: false,
    autoFormat: true,
    indentSize: 2,
    maxFileSize: 10,
    enableCache: true
};

// Global state
let isLoading = false;

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Popup: Initializing...');
    initializePopup();
});

/**
 * Initialize the popup
 */
async function initializePopup() {
    try {
        // Load current settings
        await loadCurrentSettings();

        // Setup event listeners
        setupEventListeners();

        // Load statistics
        await loadStatistics();

        console.log('Popup: Initialization complete');
        showStatusMessage('Settings loaded successfully');
    } catch (error) {
        console.error('Popup: Failed to initialize:', error);
        showStatusMessage('Failed to load settings', true);
    }
}

/**
 * Load current settings from storage
 */
async function loadCurrentSettings() {
    console.log('Popup: Loading settings...');

    try {
        const result = await browser.storage.local.get('settings');
        const settings = result.settings || DEFAULT_SETTINGS;

        // Update UI with settings
        updateUIWithSettings(settings);

        console.log('Popup: Settings loaded:', settings);
    } catch (error) {
        console.error('Popup: Error loading settings:', error);
        // Use defaults if loading fails
        updateUIWithSettings(DEFAULT_SETTINGS);
    }
}

/**
 * Update UI controls with settings values
 */
function updateUIWithSettings(settings) {
    // Theme
    const themeSelect = document.getElementById('theme');
    if (themeSelect) themeSelect.value = settings.theme || 'auto';

    // Line numbers
    const lineNumbersCheck = document.getElementById('showLineNumbers');
    if (lineNumbersCheck) lineNumbersCheck.checked = settings.showLineNumbers !== false;

    // Sort keys
    const sortKeysCheck = document.getElementById('sortKeys');
    if (sortKeysCheck) sortKeysCheck.checked = settings.sortKeys === true;

    // Auto format
    const autoFormatCheck = document.getElementById('autoFormat');
    if (autoFormatCheck) autoFormatCheck.checked = settings.autoFormat !== false;

    // Indent size
    const indentSizeSelect = document.getElementById('indentSize');
    if (indentSizeSelect) indentSizeSelect.value = settings.indentSize || 2;

    // Max file size
    const maxFileSizeInput = document.getElementById('maxFileSize');
    if (maxFileSizeInput) maxFileSizeInput.value = settings.maxFileSize || 10;

    // Enable cache
    const enableCacheCheck = document.getElementById('enableCache');
    if (enableCacheCheck) enableCacheCheck.checked = settings.enableCache !== false;
}

/**
 * Setup event listeners for all controls
 */
function setupEventListeners() {
    console.log('Popup: Setting up event listeners...');

    // Theme change
    const themeSelect = document.getElementById('theme');
    if (themeSelect) {
        themeSelect.addEventListener('change', function() {
            saveSetting('theme', this.value);
        });
    }

    // Line numbers toggle
    const lineNumbersCheck = document.getElementById('showLineNumbers');
    if (lineNumbersCheck) {
        lineNumbersCheck.addEventListener('change', function() {
            saveSetting('showLineNumbers', this.checked);
        });
    }

    // Sort keys toggle
    const sortKeysCheck = document.getElementById('sortKeys');
    if (sortKeysCheck) {
        sortKeysCheck.addEventListener('change', function() {
            saveSetting('sortKeys', this.checked);
        });
    }

    // Auto format toggle
    const autoFormatCheck = document.getElementById('autoFormat');
    if (autoFormatCheck) {
        autoFormatCheck.addEventListener('change', function() {
            saveSetting('autoFormat', this.checked);
        });
    }

    // Indent size change
    const indentSizeSelect = document.getElementById('indentSize');
    if (indentSizeSelect) {
        indentSizeSelect.addEventListener('change', function() {
            saveSetting('indentSize', parseInt(this.value));
        });
    }

    // Max file size change
    const maxFileSizeInput = document.getElementById('maxFileSize');
    if (maxFileSizeInput) {
        maxFileSizeInput.addEventListener('change', function() {
            const value = parseInt(this.value);
            if (value >= 1 && value <= 100) {
                saveSetting('maxFileSize', value);
            } else {
                this.value = 10; // Reset to default
                saveSetting('maxFileSize', 10);
            }
        });
    }

    // Enable cache toggle
    const enableCacheCheck = document.getElementById('enableCache');
    if (enableCacheCheck) {
        enableCacheCheck.addEventListener('change', function() {
            saveSetting('enableCache', this.checked);
        });
    }

    // Clear stats button
    const clearStatsBtn = document.getElementById('clearStats');
    if (clearStatsBtn) {
        clearStatsBtn.addEventListener('click', clearStatistics);
    }

    console.log('Popup: Event listeners setup complete');
}

/**
 * Save a single setting
 */
async function saveSetting(key, value) {
    if (isLoading) return; // Prevent recursive saves

    console.log(`Popup: Saving ${key} = ${value}`);
    alert(`DEBUG: Saving ${key} = ${value}`); // DEBUG

    try {
        // Get current settings
        const result = await browser.storage.local.get('settings');
        const settings = result.settings || DEFAULT_SETTINGS;

        // Update the specific setting
        settings[key] = value;

        // Save back to storage
        await browser.storage.local.set({ settings: settings });

        console.log(`Popup: Successfully saved ${key}`);
        showStatusMessage(`${key} updated`);

        // Notify content scripts via messaging (fallback)
        notifyContentScripts(settings);

    } catch (error) {
        console.error(`Popup: Failed to save ${key}:`, error);
        showStatusMessage(`Failed to save ${key}`, true);
    }
}

/**
 * Notify content scripts of settings change
 */
async function notifyContentScripts(settings) {
    try {
        // Get all tabs
        const tabs = await browser.tabs.query({});

        // Send message to each tab
        tabs.forEach(async (tab) => {
            console.log('Popup: Checking tab:', tab.url);
            if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('moz-extension://')) {
                console.log('Popup: Sending message to tab:', tab.id);
                try {
                    const response = await browser.tabs.sendMessage(tab.id, {
                        action: 'settingsUpdated',
                        settings: settings
                    });
                    console.log('Popup: Message sent successfully to tab', tab.id, response);
                } catch (error) {
                    console.log('Popup: Failed to send message to tab', tab.id, error.message);
                }
            }
        });
    } catch (error) {
        console.log('Popup: Could not notify content scripts:', error);
    }
}

/**
 * Load and display statistics
 */
async function loadStatistics() {
    console.log('Popup: Loading statistics...');

    try {
        const result = await browser.storage.local.get('stats');
        const stats = result.stats || {};

        displayStatistics(stats);
    } catch (error) {
        console.error('Popup: Failed to load statistics:', error);

        const container = document.getElementById('statsContainer');
        if (container) {
            container.innerHTML = '<div class="stats-item">Failed to load statistics</div>';
        }
    }
}

/**
 * Display statistics in the UI
 */
function displayStatistics(stats) {
    const container = document.getElementById('statsContainer');
    if (!container) return;

    container.innerHTML = '';

    if (!stats || Object.keys(stats).length === 0) {
        container.innerHTML = '<div class="stats-item">No files viewed yet</div>';
        return;
    }

    // Add header
    const headerDiv = document.createElement('div');
    headerDiv.className = 'stats-item';
    headerDiv.innerHTML = '<strong>Files viewed:</strong>';
    container.appendChild(headerDiv);

    // Sort by count and display
    const entries = Object.entries(stats)
        .filter(([key]) => key !== 'lastUsed')
        .sort((a, b) => b[1] - a[1]);

    entries.forEach(([format, count]) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'stats-item';
        itemDiv.textContent = `${format.toUpperCase()}: ${count} files`;
        container.appendChild(itemDiv);
    });

    // Last used date
    if (stats.lastUsed) {
        const date = new Date(stats.lastUsed);
        const lastUsedDiv = document.createElement('div');
        lastUsedDiv.className = 'stats-item';
        lastUsedDiv.textContent = `Last used: ${date.toLocaleDateString()}`;
        container.appendChild(lastUsedDiv);
    }

    console.log('Popup: Statistics displayed');
}

/**
 * Clear all statistics
 */
async function clearStatistics() {
    if (!confirm('Clear all usage statistics?')) {
        return;
    }

    console.log('Popup: Clearing statistics...');

    try {
        await browser.storage.local.set({ stats: {} });
        await loadStatistics(); // Refresh display
        showStatusMessage('Statistics cleared');
        console.log('Popup: Statistics cleared successfully');
    } catch (error) {
        console.error('Popup: Failed to clear statistics:', error);
        showStatusMessage('Failed to clear statistics', true);
    }
}

/**
 * Show a status message to the user
 */
function showStatusMessage(message, isError = false) {
    const statusElement = document.getElementById('statusMessage');
    if (!statusElement) return;

    statusElement.textContent = message;
    statusElement.className = 'status-message' + (isError ? ' error' : '');
    statusElement.classList.add('show');

    // Hide after 3 seconds
    setTimeout(() => {
        statusElement.classList.remove('show');
    }, 3000);
}

// Debug logging
console.log('Popup script loaded');

// Handle any unhandled errors
window.addEventListener('error', function(event) {
    console.error('Popup: Unhandled error:', event.error);
    showStatusMessage('An error occurred', true);
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', function(event) {
    console.error('Popup: Unhandled promise rejection:', event.reason);
    showStatusMessage('An error occurred', true);
});