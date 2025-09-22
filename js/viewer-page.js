/**
 * Viewer page script for displaying files
 */

// Extract URL from query parameters
function getFileUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('url');
}

// Fetch and display the file
async function loadFile() {
    const fileUrl = getFileUrl();

    if (!fileUrl) {
        showError('No file URL provided');
        return;
    }

    const fileName = fileUrl.split('/').pop().split('?')[0];
    document.getElementById('file-name').textContent = fileName;
    document.getElementById('direct-link').href = fileUrl;

    try {
        console.log('Viewer: Fetching', fileUrl);
        const response = await fetch(fileUrl);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const content = await response.text();
        const contentType = response.headers.get('content-type') || '';

        console.log('Viewer: Successfully loaded', {
            length: content.length,
            contentType: contentType
        });

        // Update file info
        document.getElementById('file-info').textContent =
            `${content.length} characters • ${contentType}`;

        // Create download link with proper filename
        const blob = new Blob([content], { type: contentType });
        const downloadUrl = URL.createObjectURL(blob);
        const downloadBtn = document.getElementById('download-btn');
        downloadBtn.href = downloadUrl;
        downloadBtn.download = fileName;

        // Create raw view link (also as blob to avoid download)
        const rawBtn = document.getElementById('raw-link');
        rawBtn.href = downloadUrl;
        rawBtn.target = '_blank';

        // Display content
        displayContent(content, contentType, fileName);

        // Hide loading, show viewer
        document.getElementById('loading').style.display = 'none';
        document.getElementById('viewer').style.display = 'block';

    } catch (error) {
        console.error('Viewer: Error loading file', error);
        showError(`Failed to load file: ${error.message}`);
    }
}

// Global variables for view toggle
let currentContent = '';
let currentLanguage = '';
let parsedData = null;
let highlightedContent = '';

// Display and format content
function displayContent(content, contentType, fileName) {
    const contentElement = document.getElementById('file-content');

    // Store content globally for toggle functionality
    currentContent = content;

    // Simulate document structure for file detection
    document.body.setAttribute('data-content-type', contentType);

    // Set content
    contentElement.textContent = content;

    // Apply syntax highlighting or tree view
    setTimeout(() => {
        try {
            // Detect language from filename extension
            const extension = fileName.split('.').pop().toLowerCase();
            let language = null;

            // Map extensions to Highlight.js language names
            const languageMap = {
                'yaml': 'yaml',
                'yml': 'yaml',
                'json': 'json',
                'xml': 'xml',
                'csv': 'csv',
                'toml': 'ini', // Highlight.js uses 'ini' for TOML-like syntax
                'txt': 'plaintext'
            };

            language = languageMap[extension] || 'plaintext';
            currentLanguage = language; // Store globally
            console.log('Viewer: Detected language:', language, 'from extension:', extension);

            // Use tree viewer for JSON and YAML files
            if ((language === 'json' || language === 'yaml') && content.trim()) {
                try {
                    let parsed;
                    if (language === 'json') {
                        parsed = JSON.parse(content);
                        console.log('Viewer: Parsed JSON for tree view');
                    } else if (language === 'yaml' && window.jsyaml) {
                        parsed = jsyaml.load(content);
                        console.log('Viewer: Parsed YAML for tree view');
                    }

                    if (parsed !== undefined && parsed !== null) {
                        // Store parsed data globally
                        parsedData = parsed;

                        // Show tree viewer
                        const treeViewer = document.getElementById('tree-viewer');
                        const preElement = document.getElementById('file-content');
                        const toggleBtn = document.getElementById('toggle-view-btn');
                        const expandBtn = document.getElementById('expand-all-btn');
                        const collapseBtn = document.getElementById('collapse-all-btn');

                        treeViewer.data = parsed;
                        treeViewer.style.display = 'block';
                        preElement.style.display = 'none';
                        toggleBtn.style.display = 'inline-block';
                        expandBtn.style.display = 'inline-block';
                        collapseBtn.style.display = 'inline-block';
                        toggleBtn.textContent = 'Code View';

                        console.log('Viewer: Displaying in tree view');

                        // Prepare syntax highlighted content for code view toggle
                        prepareCodeView(content, language);
                        return; // Exit early, don't use syntax highlighting
                    }
                } catch (e) {
                    console.log('Viewer: Tree view parsing failed, falling back to syntax highlighting:', e);
                }
            }

            // Fallback to syntax highlighting for other formats or parse failures
            let contentToHighlight = content;
            if (language === 'json') {
                try {
                    const parsed = JSON.parse(content);
                    contentToHighlight = JSON.stringify(parsed, null, 2);
                    console.log('Viewer: Formatted JSON for syntax highlighting');
                } catch (e) {
                    console.log('Viewer: JSON parsing failed, using original content');
                }
            } else if (language === 'yaml' && window.jsyaml) {
                try {
                    const parsed = jsyaml.load(content);
                    contentToHighlight = jsyaml.dump(parsed, { indent: 2 });
                    console.log('Viewer: Formatted YAML for syntax highlighting');
                } catch (e) {
                    console.log('Viewer: YAML parsing failed, using original content');
                }
            }

            // Apply Highlight.js syntax highlighting
            if (window.hljs) {
                let highlighted;
                if (language && language !== 'plaintext') {
                    highlighted = hljs.highlight(contentToHighlight, { language: language });
                    contentElement.innerHTML = highlighted.value;
                    console.log('Viewer: Applied Highlight.js highlighting for', language);
                } else {
                    // Auto-detect language
                    highlighted = hljs.highlightAuto(contentToHighlight);
                    contentElement.innerHTML = highlighted.value;
                    console.log('Viewer: Applied auto-detected highlighting:', highlighted.language);
                }
            } else {
                console.log('Viewer: Highlight.js not available, showing plain text');
                contentElement.textContent = contentToHighlight;
            }

        } catch (e) {
            console.log('Viewer: Display failed, showing plain text', e);
            contentElement.textContent = content;
        }
    }, 100);
}

// Prepare syntax-highlighted content for code view
function prepareCodeView(content, language) {
    let contentToHighlight = content;

    // Format content for better display
    if (language === 'json') {
        try {
            const parsed = JSON.parse(content);
            contentToHighlight = JSON.stringify(parsed, null, 2);
        } catch (e) {
            // Use original content if parsing fails
        }
    } else if (language === 'yaml' && window.jsyaml) {
        try {
            const parsed = jsyaml.load(content);
            contentToHighlight = jsyaml.dump(parsed, { indent: 2 });
        } catch (e) {
            // Use original content if parsing fails
        }
    }

    // Apply syntax highlighting
    if (window.hljs && language && language !== 'plaintext') {
        const highlighted = hljs.highlight(contentToHighlight, { language: language });
        highlightedContent = highlighted.value;
    } else {
        highlightedContent = contentToHighlight;
    }
}

// Show error message
function showError(message) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'block';
    document.getElementById('error-message').textContent = message;
}

// Toggle between tree view and code view
function toggleView() {
    const treeViewer = document.getElementById('tree-viewer');
    const preElement = document.getElementById('file-content');
    const toggleBtn = document.getElementById('toggle-view-btn');
    const expandBtn = document.getElementById('expand-all-btn');
    const collapseBtn = document.getElementById('collapse-all-btn');

    if (treeViewer.style.display === 'none') {
        // Switch to tree view
        if (parsedData) {
            treeViewer.data = parsedData;
            treeViewer.style.display = 'block';
            preElement.style.display = 'none';
            toggleBtn.textContent = 'Code View';
            expandBtn.style.display = 'inline-block';
            collapseBtn.style.display = 'inline-block';
            console.log('Viewer: Switched to tree view');
        }
    } else {
        // Switch to code view
        treeViewer.style.display = 'none';
        preElement.style.display = 'block';
        toggleBtn.textContent = 'Tree View';
        expandBtn.style.display = 'none';
        collapseBtn.style.display = 'none';

        // Apply syntax highlighting to code view
        if (highlightedContent) {
            preElement.innerHTML = highlightedContent;
        } else {
            preElement.textContent = currentContent;
        }
        console.log('Viewer: Switched to code view');
    }
}

// Expand all nodes in tree view
function expandAll() {
    const treeViewer = document.getElementById('tree-viewer');
    if (treeViewer) {
        // Add a small delay to ensure the component is fully initialized
        setTimeout(() => {
            try {
                console.log('Viewer: Available methods:', Object.getOwnPropertyNames(treeViewer));

                // Use the JSON Viewer's dedicated expandAll method
                if (typeof treeViewer.expandAll === 'function') {
                    treeViewer.expandAll();
                    console.log('Viewer: Expanded all nodes using expandAll()');
                } else if (typeof treeViewer.expand === 'function') {
                    // Fallback to expand with wildcard pattern
                    treeViewer.expand('**');
                    console.log('Viewer: Expanded all nodes using expand("**")');
                } else {
                    console.log('Viewer: No expand methods available on tree viewer');
                    console.log('Viewer: Available methods:', typeof treeViewer.expandAll, typeof treeViewer.expand);
                }
            } catch (e) {
                console.log('Viewer: Expand all failed:', e);
            }
        }, 100);
    }
}

// Collapse all nodes in tree view
function collapseAll() {
    const treeViewer = document.getElementById('tree-viewer');
    if (treeViewer) {
        // Add a small delay to ensure the component is fully initialized
        setTimeout(() => {
            try {
                // Use the JSON Viewer's dedicated collapseAll method
                if (typeof treeViewer.collapseAll === 'function') {
                    treeViewer.collapseAll();
                    console.log('Viewer: Collapsed all nodes using collapseAll()');
                } else if (typeof treeViewer.collapse === 'function') {
                    // Fallback to collapse with wildcard pattern
                    treeViewer.collapse('**');
                    console.log('Viewer: Collapsed all nodes using collapse("**")');
                } else {
                    console.log('Viewer: No collapse methods available on tree viewer');
                    console.log('Viewer: Available methods:', typeof treeViewer.collapseAll, typeof treeViewer.collapse);
                }
            } catch (e) {
                console.log('Viewer: Collapse all failed:', e);
            }
        }, 100);
    }
}

// Copy content to clipboard
async function copyContent() {
    try {
        let content;
        const treeViewer = document.getElementById('tree-viewer');

        if (treeViewer.style.display !== 'none' && parsedData) {
            // Copy the original raw content when in tree view
            content = currentContent;
        } else {
            // Copy the formatted content when in code view
            content = document.getElementById('file-content').textContent;
        }

        await navigator.clipboard.writeText(content);

        const btn = document.getElementById('copy-btn');
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = originalText, 2000);
    } catch (error) {
        console.error('Failed to copy:', error);
    }
}

// Reload page
function reloadPage() {
    window.location.reload();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Setup event listeners
    document.getElementById('copy-btn').addEventListener('click', copyContent);
    document.getElementById('toggle-view-btn').addEventListener('click', toggleView);
    document.getElementById('expand-all-btn').addEventListener('click', expandAll);
    document.getElementById('collapse-all-btn').addEventListener('click', collapseAll);

    // Setup retry button click handler
    const retryButtons = document.querySelectorAll('button[data-action="retry"]');
    retryButtons.forEach(btn => btn.addEventListener('click', reloadPage));

    // Load the file
    loadFile();
});