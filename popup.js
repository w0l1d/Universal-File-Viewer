/**
 * Popup settings handler
 */

// Load settings when popup opens
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    loadStatistics();

    // Attach event listeners
    document.getElementById('theme').addEventListener('change', saveSettings);
    document.getElementById('lineNumbers').addEventListener('change', saveSettings);
    document.getElementById('sortKeys').addEventListener('change', saveSettings);
    document.getElementById('autoFormat').addEventListener('change', saveSettings);
    document.getElementById('indentSize').addEventListener('change', saveSettings);
    document.getElementById('clearStats').addEventListener('click', clearStatistics);
});

// Load current settings
function loadSettings() {
    browser.storage.local.get('settings').then(result => {
        const settings = result.settings || {
            theme: 'auto',
            showLineNumbers: true,
            sortKeys: false,
            autoFormat: true,
            indentSize: 2
        };

        document.getElementById('theme').value = settings.theme;
        document.getElementById('lineNumbers').checked = settings.showLineNumbers;
        document.getElementById('sortKeys').checked = settings.sortKeys;
        document.getElementById('autoFormat').checked = settings.autoFormat;
        document.getElementById('indentSize').value = settings.indentSize;
    });
}

// Save settings
function saveSettings() {
    const settings = {
        theme: document.getElementById('theme').value,
        showLineNumbers: document.getElementById('lineNumbers').checked,
        sortKeys: document.getElementById('sortKeys').checked,
        autoFormat: document.getElementById('autoFormat').checked,
        indentSize: document.getElementById('indentSize').value
    };

    browser.storage.local.set({ settings }).then(() => {
        // Notify content scripts of settings change
        browser.tabs.query({}).then(tabs => {
            tabs.forEach(tab => {
                browser.tabs.sendMessage(tab.id, {
                    action: 'settingsUpdated',
                    settings: settings
                }).catch(() => {
                    // Ignore errors for tabs without content script
                });
            });
        });
    });
}

// Load statistics
function loadStatistics() {
    browser.storage.local.get('stats').then(result => {
        const stats = result.stats || {};
        const statsDiv = document.getElementById('stats');

        if (Object.keys(stats).length === 0) {
            statsDiv.innerHTML = '<div class="stats-item">No files viewed yet</div>';
            return;
        }

        let html = '<div class="stats-item"><strong>Files viewed:</strong></div>';

        // Sort by count
        const sorted = Object.entries(stats)
            .filter(([key]) => key !== 'lastUsed')
            .sort((a, b) => b[1] - a[1]);

        sorted.forEach(([format, count]) => {
            html += `<div class="stats-item">${format.toUpperCase()}: ${count} files</div>`;
        });

        if (stats.lastUsed) {
            const date = new Date(stats.lastUsed);
            html += `<div class="stats-item">Last used: ${date.toLocaleDateString()}</div>`;
        }

        statsDiv.innerHTML = html;
    });
}

// Clear statistics
function clearStatistics() {
    if (confirm('Clear all usage statistics?')) {
        browser.storage.local.set({ stats: {} }).then(() => {
            loadStatistics();
        });
    }
}