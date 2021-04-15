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

## Import side effects, import pruning, and tree shaking

### `defaultImportSideEffects`

This option controls how `fusion-cli` handles pruning of unused/unreachable import statements.

By default this is `true`. In other words, import statements to other packages are assumed to have import side effects unless specified otherwise. Therefore, any unreachable/unused import statements cannot be pruned/tree-shaken unless the module being imported is explicitly marked as `sideEffects: false` in its package.json. This is the most conservative setting.

Setting this to `false` means that unreachable/unused imports to packages into your app may be pruned (unless they explicitly specify import side effects in their `package.json` via the `sideEffects` field). Note that this only applies to imports to other packages from within your application source code. Imports within other packages to other packages will not be affected by this configuration. This is the recommended setting because it allows for a greater degree of import pruning with respect to imports used only in `__BROWSER__` or `__NODE__`.

Note: `defaultImportSideEffects` applies to packages but *not* your application code. Use the standard `sideEffects` field in your app `package.json` to specify which project code files, when imported, cause side effects to happen.

```js
module.exports = {
  // All packages omitting a sideEffects field are assumed to be free of import side effects
  defaultImportSideEffects: false,
};
```

Setting this to an array of package names is the same as `false` with the exception of the specified packages.

```js
module.exports = {
  // All packages omitting a sideEffects field are assumed to be free of import side effects
  // *except* core-js, which is assumed to have import side effects.
  defaultImportSideEffects: ["core-js"],
};
```

Note: Fusion.js automatically excludes `core-js`, `regenerator-runtime` from this optimization.

### `assumeNoImportSideEffects`

By default this is `false`.

Setting this to `true` enables the assumption that modules in your code do not have any import side effects. This assumption allows for more powerful tree shaking and pruning of unused imports.

This option may be useful if you import modules that use Node.js built-ins. This option makes it easier to avoid unintentionally including server-specific code in the browser bundle.

Setting this to an array of package names is the same as `true` with the exception of the specified packages.

```js
module.exports = {
  // All packages omitting a sideEffects field are assumed to be free of import side effects
  // *except* core-js, which is assumed to have import side effects.
  assumeNoImportSideEffects: ["core-js"],
};
```

Note: Fusion.js automatically excludes `core-js`, `regenerator-runtime` from this optimization.

For specifics regarding implementation details, see:

- https://webpack.js.org/guides/tree-shaking/#mark-the-file-as-side-effect-free
- https://github.com/webpack/webpack/tree/master/examples/side-effects
- https://stackoverflow.com/questions/49160752/what-does-webpack-4-expect-from-a-package-with-sideeffects-false/49203452#49203452

In the future, it is possible that some form of this behavior may be turned on by default (with ways to opt-out instead).

## `nodeBuiltins`

This is an optional property that can be used to override the Fusion.js defaults for https://v4.webpack.js.org/configuration/node/ in the browser bundle.

```js
module.exports = {
  nodeBuiltins: {
    Buffer: true,
  },
};
```

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

## `onBuildEnd`

This is an optional property that can be used to invoke a callback function when a build is completed. The function is passed metadata about the build including the build time, build target, and other build options.

```js
module.exports = {
  onBuildEnd: function (stats) {
    console.log(stats.buildTime);
  }
};
```

## `disableBuildCache`

This is an optional property that can be used to override the Fusion.js defaults for enabling persistent build cache.
If left undefined, this property will default to false.

```js
module.exports = {
  disableBuildCache: true,
};
```
