module.exports = {
    testEnvironment: "node",
    verbose: true,
    collectCoverage: true,
    coverageDirectory: ".coverage",
    coverageReporters: ["text"],
    collectCoverageFrom: [
        "!**/node_modules/**",
        "!**/vendor/**",
        "<rootDir>/server/app/*.js",
        "<rootDir>/server/app/db/db.js",
        "<rootDir>/server/app/db/abstraction/*.js"
    ],
    testPathIgnorePatterns: ["<rootDir>/public/*"]
};
