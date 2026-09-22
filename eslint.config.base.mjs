import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** 모든 설정이 공유하는 ignore 목록. */
export const ignores = {
  ignores: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/coverage/**',
    '**/.turbo/**',
    '**/.expo/**',
    '**/android/**',
    '**/ios/**',
    '**/*.d.ts',
  ],
};

/**
 * 플러그인 충돌 없이 어디에나 얹을 수 있는 최소 코어 설정.
 * eslint-config-expo 가 `import` 플러그인을 자체적으로 등록하므로
 * 그쪽과 겹치는 부분은 여기 두지 않는다.
 *
 * @type {import('typescript-eslint').ConfigArray}
 */
export const coreConfig = tseslint.config(
  ignores,
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.es2021,
        ...globals.node,
      },
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',

      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],

      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    files: [
      '**/*.{test,spec}.{ts,tsx,js,jsx}',
      '**/__tests__/**/*.{ts,tsx,js,jsx}',
      '**/jest.setup.{js,ts}',
    ],
    languageOptions: {
      globals: globals.jest,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
  {
    // metro/babel/jest 설정 파일은 CommonJS 여야 한다.
    files: ['**/*.config.js', '**/*.config.cjs', '**/jest.setup.js'],
    languageOptions: { sourceType: 'commonjs' },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
);

/**
 * 순수 TypeScript 패키지(RN 아님)용 설정.
 *
 * @type {import('typescript-eslint').ConfigArray}
 */
export const baseConfig = tseslint.config(
  ...coreConfig,
  {
    plugins: { import: importPlugin },
    rules: {
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',
    },
  },
  // prettier 와 충돌하는 포맷 규칙 비활성화 — 항상 마지막에 둔다.
  prettier,
);

export default baseConfig;
