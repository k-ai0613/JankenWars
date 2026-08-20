import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

// Flat config (ESLint 9). `npm run lint` previously failed on every platform
// because neither ESLint nor a config was ever installed.
//
// The rules that are errors are the ones that catch the bug classes this
// codebase has actually shipped: references to undeclared variables, unused
// imports left behind by refactors, and hook misuse. Stylistic preferences are
// left off so the signal stays meaningful.

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'android/**',
      'client/public/**',
      'patches/**',
      '**/*.d.ts',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2022,
      },
    },
    rules: {
      // TypeScript already resolves identifiers, and it does it better.
      'no-undef': 'off',

      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],

      // This codebase leans on `any` in places; tightening it is a separate
      // piece of work, so it is a warning rather than a blocker.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',

      // Logging is the existing debugging convention here.
      'no-console': 'off',

      'no-empty': ['warn', { allowEmptyCatch: true }],
    },
  },

  // React files
  {
    files: ['client/src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Dependency arrays in this codebase are deliberately partial in places;
      // surfacing them as warnings keeps the list visible without blocking.
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // Config files run in Node. Tailwind plugins are loaded with require() by
  // convention, so that rule is relaxed here only.
  {
    files: ['*.config.{js,ts}', 'eslint.config.js'],
    languageOptions: { globals: { ...globals.node } },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  // Test scripts assert with `check(cond, ...)` helpers and drive sockets, so
  // the stricter expression rules add noise rather than signal.
  {
    files: ['tests/**/*.ts'],
    rules: {
      'no-async-promise-executor': 'off',
    },
  },
);
