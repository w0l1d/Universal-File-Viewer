module.exports = {
    testEnvironment: 'jsdom',
    roots: ['<rootDir>/test'],
    testMatch: ['**/*.test.js'],
    collectCoverage: true,
    collectCoverageFrom: [
        'js/**/*.js',
        '!js/background.js', // Browser-specific
        '!js/formats/xml.js' // Example file
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/js/$1'
    },
    transform: {
        '^.+\\.js$': 'babel-jest'
    }
};