#!/usr/bin/env node

/**
 * Setup script for Universal File Viewer extension
 * Downloads required dependencies and prepares the extension
 */

const fs = require('fs');
const https = require('https');
const path = require('path');

const DEPENDENCIES = [
    {
        name: 'js-yaml',
        url: 'https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js',
        path: 'lib/js-yaml.min.js'
    },
    {
        name: 'highlight.js',
        url: 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/highlight.min.js',
        path: 'lib/highlight.min.js'
    },
    {
        name: 'highlight.js CSS',
        url: 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/default.min.css',
        path: 'lib/highlight.min.css'
    },
    {
        name: 'json-viewer',
        url: 'https://unpkg.com/@alenaksu/json-viewer@2.1.0/dist/json-viewer.bundle.js',
        path: 'lib/json-viewer.bundle.js'
    }
];

// Create required directories
const DIRS = ['lib', 'js/core', 'js/formats', 'css', 'dist'];

console.log('🚀 Setting up Universal File Viewer Extension...\n');

// Create directories
DIRS.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
    }
});

// Download dependencies
async function downloadFile(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);

        https.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                // Handle redirect
                https.get(response.headers.location, (redirectResponse) => {
                    redirectResponse.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        resolve();
                    });
                });
            } else {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve();
                });
            }
        }).on('error', (err) => {
            fs.unlink(filepath, () => {});
            reject(err);
        });
    });
}

// Download all dependencies
async function setupDependencies() {
    for (const dep of DEPENDENCIES) {
        console.log(`📦 Downloading ${dep.name}...`);
        try {
            await downloadFile(dep.url, dep.path);
            console.log(`✅ Downloaded ${dep.name}`);
        } catch (error) {
            console.error(`❌ Failed to download ${dep.name}: ${error.message}`);
            process.exit(1);
        }
    }
}

// Verify file structure
function verifyStructure() {
    const requiredFiles = [
        'manifest.json',
        'viewer.html',
        'js/main.js',
        'js/background.js',
        'js/viewer-page.js',
        'js/core/detector.js',
        'js/core/formatter.js',
        'js/core/highlighter.js',
        'js/core/viewer.js',
        'js/formats/json.js',
        'js/formats/yaml.js',
        'js/formats/xml.js',
        'js/formats/csv.js',
        'js/formats/toml.js',
        'css/viewer.css',
        'lib/js-yaml.min.js',
        'lib/highlight.min.js',
        'lib/highlight.min.css',
        'lib/json-viewer.bundle.js'
    ];

    const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));

    if (missingFiles.length > 0) {
        console.log('\n⚠️  Missing required files:');
        missingFiles.forEach(file => console.log(`   - ${file}`));
        console.log('\nPlease ensure all files are in place.');
        return false;
    }

    return true;
}

// Main setup
async function main() {
    try {
        await setupDependencies();

        console.log('\n🔍 Verifying file structure...');
        if (verifyStructure()) {
            console.log('✅ All required files present');
        }

        console.log('\n✨ Setup complete!\n');
        console.log('To load the extension in Firefox:');
        console.log('1. Open Firefox and navigate to about:debugging');
        console.log('2. Click "This Firefox"');
        console.log('3. Click "Load Temporary Add-on"');
        console.log('4. Select the manifest.json file\n');

        console.log('Or use web-ext for development:');
        console.log('  npm install -g web-ext');
        console.log('  web-ext run\n');

    } catch (error) {
        console.error('❌ Setup failed:', error);
        process.exit(1);
    }
}

main();