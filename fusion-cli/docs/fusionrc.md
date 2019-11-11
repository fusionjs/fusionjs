# `.fusionrc.js`

Fusion supports a `.fusionrc.js` in the root directory of your application. This must be a CommonJS module exporting an object.

This configuration object supports the following fields:

## `babel`

### Adding plugins/presets

For example, to add your own Babel plugins/preset:

```js
module.exports = {
  babel: {
    presets: ['some-babel-preset'],
    plugins: ['some-babel-plugin'],
  },
};
```

**Please note that custom Babel config is an unstable API and may not be supported in future releases.**

## `jsExtPattern`

 By default this is `/\.(mjs|js|jsx)$/`

 For example, this enables Typescript support by adding the appropriate Babel preset:

 ```js
module.exports = {
  jsExtPattern: /[jt]sx?$/,
  babel: {
    presets: ["@babel/preset-typescript"],
  }
};
```
	
 ```js
module.exports = {
  resolveExtensions: ['.wasm', '.mjs', '.js', '.json', '.ts', '.tsx'],
};
```

 ## `resolveExtensions`

 By default this is the Webpack default which is: `['.wasm', '.mjs', '.js', '.json']`

## `assumeNoImportSideEffects`

By default this is `false`.

Setting this to `true` enables the assumption that modules in your code do not have any import side effects. This assumption allows for more powerful tree shaking and pruning of unused imports.

This option may be useful if you import modules that use Node.js built-ins. This option makes it easier to avoid unintentionally including server-specific code in the browser bundle.

For specifics regarding implementation details, see:

- https://webpack.js.org/guides/tree-shaking/#mark-the-file-as-side-effect-free
- https://github.com/webpack/webpack/tree/master/examples/side-effects
- https://stackoverflow.com/questions/49160752/what-does-webpack-4-expect-from-a-package-with-sideeffects-false/49203452#49203452

In the future, it is possible that some form of this behavior may be turned on by default (with ways to opt-out instead).

## `nodeBuiltins`

This is an optional property that can be used to override the Fusion.js defaults for https://webpack.js.org/configuration/node/ in the browser bundle.

```js
module.exports = {
  nodeBuiltins: {
    Buffer: true,
  },
};
```

## `jest`

```
  globFileExt?: string
  transformIgnorePatterns?: Array<string>
  setupFilesAfterEnv?: Array<string>
```

#### globFileExt
default: `.js`

This glob file extension pattern is used by jest to find test files and
aggregate coverage raport.

#### transformIgnorePatterns
default: `['/node_modules/(?!(fusion-cli.*build))']`

An array of regexp pattern strings that are matched against all source file
paths before transformation. If the test path matches any of the patterns, it
will not be transformed.

#### setupFilesAfterEnv
default: `undefined`

A list of paths to modules that run some code to configure or set up the
testing framework before each test. This script file presents you the
opportunity of running some code immediately after the test framework has been
installed in the environment.

## `gzip`

This is an optional property that can be used to override the Fusion.js defaults for compressing projects using zlib in production builds.
If left undefined, this property will default to true.

```js
module.exports = {
  gzip: false,
};
```

## `brotli`

This is an optional property that can be used to override the Fusion.js defaults for compressing projects using brotli in production builds.
If left undefined, this property will default to true.

```js
module.exports = {
  brotli: false,
};
```
