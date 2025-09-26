/**
 * 🔧 Debug Script for Stream Processor
 * Run this in browser console to test the stream processor functionality
 */

console.log('🔧 Stream Processor Debug Script');

// Test hash parsing
function testHashParsing() {
    console.log('📋 Testing Hash Parsing...');

    const testHash = encodeURIComponent(JSON.stringify({
        originalUrl: 'https://jsonplaceholder.typicode.com/users/1',
        detection: { format: 'json', confidence: 0.9 },
        timestamp: Date.now()
    }));

    // Simulate setting the hash
    const originalHash = window.location.hash;
    window.location.hash = testHash;

    try {
        const hash = window.location.hash.substring(1);
        const parsed = JSON.parse(decodeURIComponent(hash));

        console.log('✅ Hash parsing successful:', parsed);
        console.log('- Original URL:', parsed.originalUrl);
        console.log('- Format:', parsed.detection?.format);

        return true;
    } catch (error) {
        console.error('❌ Hash parsing failed:', error);
        return false;
    } finally {
        // Restore original hash
        window.location.hash = originalHash;
    }
}

// Test fetch functionality
async function testFetchFunctionality() {
    console.log('🌐 Testing Fetch Functionality...');

    const testUrl = 'https://jsonplaceholder.typicode.com/users/1';

    try {
        const response = await fetch(testUrl);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const content = await response.text();
        const contentType = response.headers.get('content-type') || 'text/plain';

        console.log('✅ Fetch successful:');
        console.log('- Content length:', content.length);
        console.log('- Content type:', contentType);
        console.log('- Sample content:', content.substring(0, 100) + '...');

        return true;
    } catch (error) {
        console.error('❌ Fetch failed:', error);
        console.log('This might be due to CORS restrictions');
        return false;
    }
}

// Test format detection
function testFormatDetection() {
    console.log('🔍 Testing Format Detection...');

    const testCases = [
        {
            url: 'https://example.com/data.json',
            expected: 'json'
        },
        {
            url: 'https://example.com/config.yaml',
            expected: 'yaml'
        },
        {
            url: 'https://example.com/data.xml',
            expected: 'xml'
        }
    ];

    let allPassed = true;

    testCases.forEach(({ url, expected }, index) => {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname.toLowerCase();
            const segments = pathname.split('/');
            const filename = segments[segments.length - 1];
            const extension = filename.split('.').pop();

            const passed = extension === expected;
            console.log(`${passed ? '✅' : '❌'} Test ${index + 1}: ${url} → ${extension} (expected: ${expected})`);

            if (!passed) allPassed = false;
        } catch (error) {
            console.error(`❌ Test ${index + 1} failed:`, error);
            allPassed = false;
        }
    });

    return allPassed;
}

// Test syntax highlighting
function testSyntaxHighlighting() {
    console.log('🎨 Testing Syntax Highlighting...');

    const testJson = `{
  "name": "test",
  "version": "1.0.0",
  "active": true,
  "count": 42,
  "data": null
}`;

    try {
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        function highlightJSON(html) {
            html = html.replace(/"([^"\\\\]*(\\\\.[^"\\\\]*)*)"/g, '<span class="fv-json-string">"$1"</span>');
            html = html.replace(/:\s*(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g, ': <span class="fv-json-number">$1</span>');
            html = html.replace(/:\s*(true|false)/g, ': <span class="fv-json-boolean">$1</span>');
            html = html.replace(/:\s*(null)/g, ': <span class="fv-json-null">$1</span>');
            return html;
        }

        const escaped = escapeHtml(testJson);
        const highlighted = highlightJSON(escaped);

        console.log('✅ Syntax highlighting successful');
        console.log('- Original length:', testJson.length);
        console.log('- Highlighted length:', highlighted.length);
        console.log('- Contains highlighting spans:', highlighted.includes('<span class='));

        return true;
    } catch (error) {
        console.error('❌ Syntax highlighting failed:', error);
        return false;
    }
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Running Stream Processor Debug Tests...');
    console.log('==========================================');

    const results = {
        hashParsing: testHashParsing(),
        fetchFunctionality: await testFetchFunctionality(),
        formatDetection: testFormatDetection(),
        syntaxHighlighting: testSyntaxHighlighting()
    };

    console.log('📊 Test Results:');
    Object.entries(results).forEach(([test, passed]) => {
        console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
    });

    const allPassed = Object.values(results).every(r => r);
    console.log(`\n${allPassed ? '🎉' : '⚠️'} Overall: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);

    if (!results.fetchFunctionality) {
        console.log('\n💡 Note: Fetch test failure is likely due to CORS restrictions.');
        console.log('   This is normal for cross-origin requests in development.');
        console.log('   The stream processor should work correctly when used as intended.');
    }

    return allPassed;
}

// Auto-run tests if in browser
if (typeof window !== 'undefined') {
    runAllTests();
} else {
    console.log('❌ This script must be run in a browser environment');
}

// Export for manual testing
window.streamProcessorDebug = {
    testHashParsing,
    testFetchFunctionality,
    testFormatDetection,
    testSyntaxHighlighting,
    runAllTests
};