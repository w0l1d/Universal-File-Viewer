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
        // Clear the page and set up head elements safely
        document.head.innerHTML = '';

        const meta = document.createElement('meta');
        meta.setAttribute('charset', 'utf-8');
        document.head.appendChild(meta);

        const title = document.createElement('title');
        title.textContent = `File Viewer - ${url.split('/').pop()}`;
        document.head.appendChild(title);

        // Create page structure safely using DOM methods
        document.body.innerHTML = '';

        const outerDiv = document.createElement('div');
        outerDiv.style.cssText = 'font-family: monospace; padding: 20px; background: #f5f5f5; min-height: 100vh;';

        const innerDiv = document.createElement('div');
        innerDiv.style.cssText = 'background: white; padding: 15px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);';

        const headerDiv = document.createElement('div');
        headerDiv.style.cssText = 'margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #ddd;';

        const strong = document.createElement('strong');
        strong.textContent = 'File Viewer';
        headerDiv.appendChild(strong);
        headerDiv.appendChild(document.createTextNode(' - ' + url.split('/').pop()));
        headerDiv.appendChild(document.createElement('br'));

        const small = document.createElement('small');
        small.style.color = '#666';
        small.textContent = 'Content-Type: ' + contentType;
        headerDiv.appendChild(small);

        const pre = document.createElement('pre');
        pre.id = 'file-content';
        pre.style.cssText = 'white-space: pre-wrap; word-wrap: break-word; margin: 0; font-size: 14px; line-height: 1.4;';
        pre.textContent = content;

        innerDiv.appendChild(headerDiv);
        innerDiv.appendChild(pre);
        outerDiv.appendChild(innerDiv);
        document.body.appendChild(outerDiv);

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
        document.body.innerHTML = '';

        const container = document.createElement('div');
        container.style.cssText = 'font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 50px auto;';

        const heading = document.createElement('h2');
        heading.style.color = '#e74c3c';
        heading.textContent = '⚠️ File Viewer Error';
        container.appendChild(heading);

        const failedPara = document.createElement('p');
        const strong1 = document.createElement('strong');
        strong1.textContent = 'Failed to fetch:';
        failedPara.appendChild(strong1);
        failedPara.appendChild(document.createTextNode(' ' + url.split('/').pop()));
        container.appendChild(failedPara);

        const errorPara = document.createElement('p');
        const strong2 = document.createElement('strong');
        strong2.textContent = 'Error:';
        errorPara.appendChild(strong2);
        errorPara.appendChild(document.createTextNode(' ' + error.message));
        container.appendChild(errorPara);

        const helpPara = document.createElement('p');
        helpPara.style.cssText = 'color: #666; font-size: 14px;';
        helpPara.textContent = 'This might be due to CORS restrictions or the file being unavailable. Try opening the file directly or check your network connection.';
        container.appendChild(helpPara);

        const retryButton = document.createElement('button');
        retryButton.textContent = 'Retry';
        retryButton.style.cssText = 'padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;';
        retryButton.addEventListener('click', () => window.location.reload());
        container.appendChild(retryButton);

        document.body.appendChild(container);
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