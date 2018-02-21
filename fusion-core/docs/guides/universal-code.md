# Universal code

Fusion.js has first class support for universal code.

By default, code runs in both server and browser. This means that plugin registration code only needs to be written once, and that plugins can activate behavior across the entire lifecycle of an application without the need to configure things in different parts of the app. It also means that you can write React code once and have that code be automatically server-side rendered as you would expect.

However, it is also sometimes desirable to write server-only code, browser-only code, and at times, development-only code. To enable that, Fusion.js provides the `__NODE__`, `__BROWSER__` and `__DEV__` global flags. These special flags are statically replaced by the compiler with the appropriate boolean value, depending on which bundle the code is compiled for. Then, unused code gets removed via tree shaking and dead code elimination.

To write code that only runs in the server, wrap your code in the appropriate code fence:

```js
if (__NODE__) {
  // server-side code goes here
}
```

To write code that only runs in the browser:

```js
if (__BROWSER__) {
  // client-side code goes here
}
```

We recommend that you only use `__DEV__` to enhance developer experience with regards to error conditions:

```js
// this conditional gets removed from the browser bundle in production, saving a few bytes
if (__DEV__) {
  throw new Error('The `{options}` argument is required. See the documentation at https://the-docs-website/api-docs/the-package');
}
```

You should avoid writing significantly different code branches for different environments since doing so introduces more potential points of failure, and makes it more difficult to reproduce issues with confidence.

We also recommend that you use `__DEV__` and avoid using `process.env.NODE_ENV === 'production'`, since Fusion.js provides better static compilation and eslint support for the former.

# Imports

The ES6 standard specifies that `import`/`export` syntax cannot appear inside of `if` statement of conditional expressions, but Fusion.js is still able to intelligently eliminate server-side imports from client-side bundles, thanks to tree-shaking.

Consider the example below:

```js
import fs from 'fs';

if (__NODE__) fs.readFileSync('package.json');
```

The compiler removes the `fs.readFileSync()` call from the browser bundle because the `if (__NODE__)` code fence evaluates to `false`, making the code branch unreacheable.

The `import` statement is outside of the code fence, but it is also removed because the compiler infers that it's also dead code, because no code paths ever use `fs` in this file for the browser bundle!

### Server-side side effects in dependencies

On some rare occasions, poorly written server-side packages might incur top-level side-effects. In those cases, the compiler becomes unable to treeshake the misbehaving dependency in the browser bundle, and compilation typically fails due to unpolyfilled server dependencies.

A simple way to avoid this issue is to load the module dynamically via a good old CommonJS `require` call.

```js
// before
import foo from 'misbehaving-dependency';

// after
const foo = __NODE__ && require('misbehaving-dependency');
```

Now the code follows the basic dead code elimination rules and the browser bundle will be compiled as expected.

---

# Linting

Fusion.js provides an `eslint-config-fusion` configuration that issues contextual warnings depending on whether code is server-side or client-side.

```sh
yarn add eslint-config-fusion
```

To enable it, add it to your `.eslintrc.js`:

```js
module.exports = {
  extends: [
    require.resolve('eslint-config-fusion')
  ]
};
```

Now ESLint will complain if you inadvertedly forget to code-fence:

```js
// we didn't code fence this browser-specific code, so it would also try to run in the server. Thus, eslint complains
window.addEventListener('load', () => {});

// after we code-fence, the eslint warning goes away
if (__BROWSER__) {
  window.addEventListener('load', () => {});
}
```

You can also mark an entire file as server-only or browser-only:

```js
/* eslint-env node */
```

```js
/* eslint-env browser */
```

This pattern is useful if a plugin has vastly different implementations on the server and the browser:

```js
// plugin-entry-point.js
import server from './server';
import client from './client';

export default __NODE__ ? server : client;

// server.js
/* eslint-env node */
export default () => {
  // server code goes here
}

// server.js
/* eslint-env browser */
export default () => {
  // browser code goes here
}
```
