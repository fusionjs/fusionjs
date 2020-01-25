// @flow
module.exports = {
  extends: [
    'plugin:react/recommended',
    'plugin:jest/recommended',
    './rules/imports.js',
    // This comes last so that prettier-config can turn off appropriate rules given the order of precedence by eslint 'extends'
    require.resolve('eslint-config-uber-universal-stage-3'),
  ],

  plugins: [
    'eslint-plugin-react',
    'eslint-plugin-react-hooks',
  ],
  rules: {
    // We should be using flow rather than propTypes
    'react/prop-types': 'off',

    // Enforce hook rules
    // https://reactjs.org/docs/hooks-faq.html#what-exactly-do-the-lint-rules-enforce
    'react-hooks/rules-of-hooks': 'error',
    // https://github.com/facebook/react/issues/14920
    'react-hooks/exhaustive-deps': 'warn',

    'require-atomic-updates': 0,
  },
  settings: {
    react: {
      version: 'latest',
    },
  },
};
