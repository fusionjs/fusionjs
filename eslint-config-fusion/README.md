# eslint-config-fusion

[![Build status](https://badge.buildkite.com/01c3da1b182dcf927a9627fe5ae0bcc00578f48426756da78a.svg?branch=master)](https://buildkite.com/uberopensource/eslint-config-fusion?branch=master)

`eslint-config-fusion` is an [eslint](https://www.github.com/eslint/eslint) config recommended for use with Fusion.js.

## Usage

Extend `eslint-config-fusion` in your `.eslintrc.js`:

```js
module.exports = {
  extends: [
    require.resolve('eslint-config-fusion')
  ]
};
```
