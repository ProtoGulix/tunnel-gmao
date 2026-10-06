import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  // Base JS/TS setup
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    plugins: { js },
    extends: ['js/recommended'],
    languageOptions: { globals: globals.browser },
  },
  // TypeScript rules (only for ts/tsx)
  ...tseslint.configs.recommended.map((cfg) => ({ ...cfg, files: ['**/*.{ts,tsx}'] })),
  // React recommended
  pluginReact.configs.flat.recommended,
  // Global overrides and extra plugins
  {
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      'react/prop-types': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-alert': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  // Architecture enforcement: Prevent backend leaks
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    ignores: ['src/lib/api/client.js', 'src/lib/api/adapters/**'],
    rules: {
      'max-params': ['error', 8],
      'max-depth': ['error', 3],
      'max-lines': ['error', { max: 200, skipBlankLines: true, skipComments: true }],
      complexity: ['error', 10],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['axios', 'axios/*'],
              message:
                'axios must only be imported in src/lib/api/client.js. Use the facade API instead.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/directus/i]',
          message: 'Backend-specific term "directus" must not appear outside adapters.',
        },
        {
          selector: 'Literal[value=/_eq/]',
          message: 'Backend filter "_eq" must not appear outside adapters.',
        },
        {
          selector: 'Literal[value=/_and/]',
          message: 'Backend filter "_and" must not appear outside adapters.',
        },
        {
          selector: 'Literal[value=/_or/]',
          message: 'Backend filter "_or" must not appear outside adapters.',
        },
        {
          selector: 'Literal[value=/_raw/]',
          message: 'Backend-specific field "_raw" must not appear in domain code.',
        },
        {
          selector:
            'Literal[value=/[\\u{1F300}-\\u{1F9FF}\\u{2600}-\\u{27BF}\\u{2B50}\\u{2705}\\u{274C}\\u{2714}\\u{26A0}\\u{2192}\\u{21BB}\\u{00B7}\\u{25C6}]/u]',
          message:
            'Les emojis et caractères Unicode décoratifs sont interdits dans le code. Utilisez les icônes Lucide React (import { Icon } from "lucide-react").',
        },
      ],
    },
  },
  // Additional restriction: No backend imports outside adapters
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    ignores: ['src/lib/api/adapters/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/adapters/directus/**', '**/adapters/*/'],
              message:
                'Adapter internals must not be imported outside the adapter directory. Use src/lib/api/facade instead.',
            },
          ],
        },
      ],
    },
  },
  // Ensure TS-specific rules do not apply to JS/JSX
  {
    files: ['**/*.{js,jsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  // Mock adapter: Allow 'any' and unused vars (minimal implementation)
  {
    files: ['src/lib/api/adapters/mock/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  // ApiAdapter interface: Allow 'any' for client.api and error details
  {
    files: ['src/lib/api/adapters/ApiAdapter.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
]);
