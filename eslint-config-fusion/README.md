# eslint-config-fusion

[![Build status](https://badge.buildkite.com/7a82192275779f6a8ba81f7d4a1b0d294256838faa1dfdf080.svg?branch=master)](https://buildkite.com/uberopensource/fusionjs)

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
