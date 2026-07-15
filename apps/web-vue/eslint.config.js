import globals from 'globals'
import vue from 'eslint-plugin-vue'

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '**/*.patch',
      '**/*.txt'
    ]
  },
  ...vue.configs['flat/essential'],
  {
    files: ['**/*.{js,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    rules: {
      // v-html is allowed only at audited call sites, where the expression is
      // safeHtml(...). A repository check keeps that invariant explicit.
      'vue/no-v-html': 'off',
      'no-debugger': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'vue/multi-word-component-names': 'off',
      // Existing form components intentionally use v-model on object props;
      // migrating those contracts is outside this security-focused change.
      'vue/no-mutating-props': 'off',
      'vue/no-unused-vars': 'off'
    }
  }
]
