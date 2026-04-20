import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', '.angular/**', 'node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx,js,mjs,cjs}'],
    rules: {
      curly: ['error', 'all'],
      'brace-style': ['error', '1tbs', { allowSingleLine: false }],
    },
  },
);
