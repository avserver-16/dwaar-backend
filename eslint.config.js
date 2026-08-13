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
    }
];