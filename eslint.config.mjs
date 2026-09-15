import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  { files: ["**/*.{js,mjs,cjs}"],
    plugins: { js },
    extends: [js.configs.recommended], 
    languageOptions: { globals: globals.node },
    rules: {
      "no-duplicate-imports": "error",
      "no-inner-declarations": "error",
      "no-unreachable-loop": "error",
      "camelcase": ["error", { properties: "never" }],
      "dot-notation": "error",
      "eqeqeq": ["error", "always"],
      "func-name-matching": "error",
      "no-else-return": "error",
      "no-var": "error",
      "prefer-const": "error",
      "require-await": "error",
    }
  },
  { files: ["**/*.js"], languageOptions: { sourceType: "commonjs" } },
]);
