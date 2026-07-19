export default [
  {
    ignores: ['dist/**', 'node_modules/**', '.tmp/**', 'vite.config.ts', 'dist'],
  },
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off',
    },
  },
]
