/**
 * Direct content fetcher - Alternative approach for files that get downloaded
 * This script creates a custom display page for downloaded files
 */
(() => {
    // Check if this page is a browser download page or empty page that should show YAML
    function checkForDirectDisplay() {
        const url = window.location.href;

        // Check if URL looks like a supported file
        if (hasSupportedExtension(url)) {
            console.log('File Viewer Fetcher: Detected supported file URL, attempting direct fetch');
            fetchAndDisplay(url);
        }
    }

    // Check if URL has supported extension
    function hasSupportedExtension(url) {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname.toLowerCase();
            const filename = pathname.split('/').pop();
            const extension = filename.includes('.') ? filename.split('.').pop() : '';
            return ['yaml', 'yml', 'json', 'xml', 'csv', 'toml'].includes(extension);
        } catch (e) {
            return false;
        }
    }

    // Fetch content and display it
    async function fetchAndDisplay(url) {
        try {
            console.log('File Viewer Fetcher: Fetching', url);

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const content = await response.text();
            const contentType = response.headers.get('content-type') || '';

            console.log('File Viewer Fetcher: Successfully fetched content', {
                length: content.length,
                contentType: contentType
            });

            // Replace page content with the fetched content
            displayContent(content, url, contentType);

        } catch (error) {
            console.error('File Viewer Fetcher: Failed to fetch content', error);
            showError(error, url);
        }
    }

    // Display content in the browser
    function displayContent(content, url, contentType) {
        // Clear the page
        document.head.innerHTML = `
            <meta charset="utf-8">
            <title>File Viewer - ${url.split('/').pop()}</title>
        `;

        // Create a pre element to display the content
        document.body.innerHTML = `
            <div style="font-family: monospace; padding: 20px; background: #f5f5f5; min-height: 100vh;">
                <div style="background: white; padding: 15px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                    <div style="margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #ddd;">
                        <strong>File Viewer</strong> - ${url.split('/').pop()}
                        <br>
                        <small style="color: #666;">Content-Type: ${contentType}</small>
                    </div>
                    <pre id="file-content" style="white-space: pre-wrap; word-wrap: break-word; margin: 0; font-size: 14px; line-height: 1.4;">${escapeHtml(content)}</pre>
                </div>
            </div>
        `;

        // Set the document content type to trigger our main extension
        try {
            Object.defineProperty(document, 'contentType', {
                value: contentType,
                writable: false
            });
        } catch (e) {
            // Ignore if property is already defined
        }

        // Trigger the main file viewer after a short delay
        setTimeout(() => {
            console.log('File Viewer Fetcher: Triggering main file viewer');

            // Manually trigger the main extension initialization
            if (window.FileDetector && window.Viewer) {
                const format = FileDetector.detect();
                if (format) {
                    console.log('File Viewer Fetcher: Detected format', format);
                    // The main extension should take over from here
                }
            }
        }, 100);
    }

    // Show error message
    function showError(error, url) {
        document.body.innerHTML = `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 50px auto;">
                <h2 style="color: #e74c3c;">⚠️ File Viewer Error</h2>
                <p><strong>Failed to fetch:</strong> ${url.split('/').pop()}</p>
                <p><strong>Error:</strong> ${error.message}</p>
                <p style="color: #666; font-size: 14px;">
                    This might be due to CORS restrictions or the file being unavailable.
                    Try opening the file directly or check your network connection.
                </p>
                <button onclick="window.location.reload()"
                        style="padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Retry
                </button>
            </div>
        `;
    }

    // HTML escape function
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Run the check when the page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkForDirectDisplay);
    } else {
        checkForDirectDisplay();
    }
})();