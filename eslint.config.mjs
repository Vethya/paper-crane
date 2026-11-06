import nextPlugin from '@next/eslint-plugin-next'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'

export default [
  {
    ignores: ['.next/**', 'storybook-static/**', 'output/**']
  },
  reactPlugin.configs.flat.recommended,
  ...tsPlugin.configs['flat/recommended'],
  nextPlugin.flatConfig.recommended,
  {
    files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
    plugins: {
      'react-hooks': reactHooksPlugin
    },
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2018,
      sourceType: 'module'
    },
    settings: {
      react: {
        pragma: 'React',
        version: 'detect'
      }
    },
    rules: {
      'no-console': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/display-name': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { args: 'none' }],
      '@typescript-eslint/no-inferrable-types': 'off'
    }
  }
]
