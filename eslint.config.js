const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
    {
        files: ["**/*.js"],
        ignores: [
            "node_modules/**",
            "coverage/**"
        ],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "commonjs",
            globals: {
                ...globals.node
            }
        },
        ...js.configs.recommended
    },

    // Jest test files
    {
        files: ["**/*.test.js", "**/*.spec.js", "**/__tests__/**/*.js"],
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.jest
            }
        }
    }
];