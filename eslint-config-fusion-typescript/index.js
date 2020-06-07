// @flow
module.exports = {
  extends: [
    "plugin:@typescript-eslint/recommended",
  ],

  plugins: [
    '@typescript-eslint',
  ],
  rules: {
    // Don't require a return type for all functions
    "@typescript-eslint/explicit-function-return-type": 0,
  },
  overrides: [
    {
      files: ["**/*.ts", "**/*.tsx"],
      rules: {
        'import/no-unresolved': 0
      }
    }
  ],
};
