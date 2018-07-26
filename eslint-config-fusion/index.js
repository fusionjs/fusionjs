// @flow
module.exports = {
  extends: [
    'plugin:flowtype/recommended',
    'plugin:react/recommended',
    'plugin:jest/recommended',
    './rules/imports.js',
    // This comes last so that prettier-config can turn off appropriate rules given the order of precedence by eslint 'extends'
    require.resolve('eslint-config-uber-universal-stage-3'),
  ],

  plugins: ['eslint-plugin-flowtype', 'eslint-plugin-react'],
  rules: {
    // Enforce flow file declarations
    'flowtype/require-valid-file-annotation': ['error', 'always'],

    // We should be using flow rather than propTypes
    'react/prop-types': 'off',

    // Enforces consistent spacing within generic type annotation parameters.
    // https://github.com/gajus/eslint-plugin-flowtype/blob/master/.README/rules/generic-spacing.md
    'flowtype/generic-spacing': 'off',
  },
};
