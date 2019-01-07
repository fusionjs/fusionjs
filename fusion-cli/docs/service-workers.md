# Service worker bundling

Fusion CLI can optionally produce a SW bundle.

## Bundling a service worker

First create a `src/sw.js` file with a default function export. This function should contains your service worker logic.

```js
// src/sw.js

export default function swMain(...args) {
  self.addEventListener("install" /* ... */);
  self.addEventListener("fetch" /* ... */);
}
```

## Importing the template

The service worker template function returns a string containing the bundled service worker code.

Any arguments passed to the template function will be serialized into the service worker code and passed as arguments to the main function exported in `src/sw.js`. This allows for the service worker code to have dependencies not known at build-time such as environment variables.

```js
import { swTemplate } from "fusion-cli/sw";

const sw = swTemplate({ foo: "bar" }, 12345);

app.middleware((ctx, next) => {
  if (ctx.url === "/sw.js") {
    ctx.body = sw;
  }
  return next();
});
```
