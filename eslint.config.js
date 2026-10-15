import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

// Pārbauda kodu pret JavaScript pamatnoteikumiem, React noteikumiem (Rules of Hooks un
// "komponentēm jābūt tīrām") un TypeScript noteikumiem. Pārejas laikā darbojas gan .js/.jsx,
// gan .ts/.tsx faili.
export default defineConfig([
    { ignores: ['dist/**', 'node_modules/**'] },
    js.configs.recommended,
    react.configs.flat.recommended,
    react.configs.flat['jsx-runtime'],
    reactHooks.configs.flat['recommended-latest'],
    {
        files: ['**/*.{js,jsx,ts,tsx}'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: globals.browser,
        },
        settings: { react: { version: 'detect' } },
        // TypeScript tipi aizstāj PropTypes
        rules: { 'react/prop-types': 'off' },
    },
    {
        // Jaunais TypeScript kods: typescript-eslint ieteiktie noteikumi
        files: ['**/*.{ts,tsx}'],
        extends: [tseslint.configs.recommended],
        rules: { '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }] },
    },
    {
        // Konfigurācijas faili darbojas Node vidē, nevis pārlūkā
        files: ['*.config.{js,ts}'],
        languageOptions: { globals: globals.node },
    },
]);
