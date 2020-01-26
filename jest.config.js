module.exports = {
    setupFilesAfterEnv: ["jest-extended"],
    testEnvironment: "node",
    verbose: true,
    collectCoverage: true,
    coverageDirectory: ".coverage",
    coverageReporters: ["text"],
    collectCoverageFrom: [
        "!**/node_modules/**",
        "!**/vendor/**",
        "<rootDir>/server/app/*.js",
        "!<rootDir>/server/app/datatables.js",
        "!<rootDir>/server/app/select.js",
        "<rootDir>/server/app/db/db.js",
        "<rootDir>/server/app/db/abstraction/postgresql.js",
        "<rootDir>/server/app/db/abstraction/mysql.js"
    ],
    testPathIgnorePatterns: [
        "<rootDir>/public/*",
        "<rootDir>/infra/*"
    ]
};
