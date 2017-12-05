module.exports = {
  extends: [
    'plugin:flowtype/recommended',
    'plugin:react/recommended',
    './rules/imports.js',
    // This comes last so that prettier-config can turn off appropriate rules given the order of precedence by eslint 'extends'
    require.resolve('eslint-config-uber-universal-stage-3'),
  ],

  plugins: ['eslint-plugin-flowtype', 'eslint-plugin-react'],
  rules: {
    // We should be using flow rather than propTypes
    'react/prop-types': 'off',
  },
};
