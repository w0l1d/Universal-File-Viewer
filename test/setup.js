/**
 * Test environment setup
 */

// Mock browser API for testing
global.browser = {
    storage: {
        local: {
            get: jest.fn(() => Promise.resolve({})),
            set: jest.fn(() => Promise.resolve())
        }
    },
    runtime: {
        onMessage: {
            addListener: jest.fn()
        },
        sendMessage: jest.fn(() => Promise.resolve())
    },
    tabs: {
        query: jest.fn(() => Promise.resolve([])),
        sendMessage: jest.fn(() => Promise.resolve())
    }
};

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
};
global.localStorage = localStorageMock;

// Mock document
global.document = {
    contentType: 'text/plain',
    body: {
        textContent: '',
        innerHTML: '',
        appendChild: jest.fn()
    },
    createElement: jest.fn((tag) => ({
        className: '',
        innerHTML: '',
        textContent: '',
        dataset: {},
        appendChild: jest.fn(),
        addEventListener: jest.fn(),
        querySelector: jest.fn(),
        querySelectorAll: jest.fn(() => [])
    })),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(() => [])
};

// Mock window
global.window = {
    location: {
        href: 'http://example.com/test.json',
        pathname: '/test.json'
    },
    matchMedia: jest.fn(() => ({
        matches: false
    }))
};

// Mock navigator
global.navigator = {
    clipboard: {
        writeText: jest.fn(() => Promise.resolve())
    }
};