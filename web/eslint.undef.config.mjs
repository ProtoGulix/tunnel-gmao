// Contrôle minimal lancé par scripts/check.sh : noms non définis seulement (variable ou
// composant JSX sans import). Le build vite ne les voit pas ; le lint complet du web a des
// erreurs anciennes et reste hors de check.sh. Couvre aussi mobile/src, qui n'a pas d'eslint.
import globals from 'globals';
import pluginReact from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  {
    files: ['**/*.{js,jsx}'],
    ignores: ['**/*.test.js'],
    // Plugins chargés pour reconnaître les commentaires eslint-disable existants.
    plugins: { react: pluginReact, 'react-hooks': reactHooks },
    linterOptions: { reportUnusedDisableDirectives: 'off' },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, __APP_VERSION__: 'readonly' },
    },
    rules: {
      'no-undef': 'error',
      'react/jsx-no-undef': 'error',
      'react/jsx-uses-vars': 'error',
    },
  },
];
