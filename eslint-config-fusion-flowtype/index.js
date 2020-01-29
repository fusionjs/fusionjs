// @flow
module.exports = {
  extends: [
    'plugin:flowtype/recommended',
  ],

  plugins: [
    'eslint-plugin-flowtype',
  ],
  rules: {
    // Enforce flow file declarations
    'flowtype/require-valid-file-annotation': ['error', 'always'],

    // Enforces consistent spacing within generic type annotation parameters.
    // https://github.com/gajus/eslint-plugin-flowtype/blob/master/.README/rules/generic-spacing.md
    'flowtype/generic-spacing': 'off',

    // Fix inconsistency between Flow (inherited rule from flowtype/recommended) and Prettier
    // https://jeng.uberinternal.com/browse/WPT-3404
    'flowtype/space-after-type-colon': 'off',
  },
};
