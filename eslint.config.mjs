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
  // Ensure TS-specific rules do not apply to JS/JSX
  {
    files: ['**/*.{js,jsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
]);
