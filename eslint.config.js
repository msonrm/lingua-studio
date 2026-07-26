import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'src/test/__snapshots__'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // tsconfig の noUnusedLocals / noUnusedParameters と役割が重なるが、
      // ESLint 側は `_` 始まりを許容する形に揃えておく
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // Blockly の API は any を返す箇所があり、既存コードに多数存在する。
      // Phase 2 以降で減らしていく想定なので、まずは warn で可視化する。
      '@typescript-eslint/no-explicit-any': 'warn',

      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    // テストは Node 環境で動く
    files: ['src/test/**/*.ts', '*.config.ts'],
    languageOptions: { globals: globals.node },
  }
);
