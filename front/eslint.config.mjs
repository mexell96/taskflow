import js from '@eslint/js';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', '.angular/**', 'node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.html'],
    rules: {},
  },
  {
    files: ['**/*.{ts,tsx,js,mjs,cjs}'],
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      curly: ['error', 'all'],
      'brace-style': ['error', '1tbs', { allowSingleLine: false }],
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^\\u0000', '^node:', '^@(?!app(?:/|$)|env(?:/|$))\\w', '^\\w'],
            ['^@app(?:/.*|$)', '^@env(?:/.*|$)', '^\\.'],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',
    },
  },
);
