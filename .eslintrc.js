module.exports = {
  extends: [require.resolve('eslint-config-fusion')],
  rules: {
    'no-unused-vars': [
      'error',
      {vars: 'all', args: 'none', varsIgnorePattern: '^h$'},
    ],
    'react/react-in-jsx-scope': 'off',
  },
};
