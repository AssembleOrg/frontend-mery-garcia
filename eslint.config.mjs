// eslint.config.mjs
import nextPlugin from '@next/eslint-plugin-next';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

/** @type {import('eslint').Linter.FlatConfig[]} */
const eslintConfig = [
  nextPlugin.configs.recommended,
  nextPlugin.configs['core-web-vitals'],

  {
    rules: {
      'react-hooks/exhaustive-deps': ['error'],

    },
  },

  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      ...prettierConfig.rules,
      'prettier/prettier': 'error',
    },
  },

  {
    ignores: [
      '.next/',
      'node_modules/',
      'out/',
      '*.config.js',
      '*.config.mjs',
    ],
  },
];

export default eslintConfig;