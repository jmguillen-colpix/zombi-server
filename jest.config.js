module.exports = {
    verbose: true,
    collectCoverage: true,
    collectCoverageFrom: [
        "**/*.{js,jsx}",
        "!**/node_modules/**",
        "!**/vendor/**"
    ],
    coverageDirectory: ".coverage",
    coverageReporters: ["text"]
};