# Modifying the HTML template

Modify the HTML template of a Fusion.js plugin with middleware plugins.

When a page is server-side rendered, the `ctx.template` property in the middleware is an object:

```js
ctx.template = {
  htmlAttrs: {}
  title: '',
  head: [],
  body: []
}
```

To modify the title, use:

```js
export default () => (ctx, next) => {
  ctx.template.title = 'the new title';
  return next();
};
```

Similarly, to add attributes to the `<html>` tag, use:

```js
export default () => (ctx, next) => {
  ctx.template.htmlAttrs.lang = 'en-US';
  return next();
};
```

To add arbitrary HTML to `<head>` and `<body>`, however, you must sanitize the HTML to ensure that there's no risk of an XSS attack from unsanitized user data.

To sanitize HTML, use the `html` template tag:

```js
import {html} from 'fusion-core';

export default () => (ctx, next) => {
  ctx.template.head.push(
    html`<link href="https://fonts.googleapis.com/css?family=Open+Sans" rel="stylesheet" />`
  );
  return next();
};
```

The `html` template tag sanitizes template string interpolations and return a _safe_ string.

Note that pushing unsanitized strings to either `head` or `body` will result in an error.

### When is a page server-side rendered

Fusion.js assumes a page requires server-side rendering if the HTTP request has an `Accept` header containing `text/html`. This header value exists when URLs that are requested from a browser address bar, but it does not for programmatic requests such as XHR/fetch or assets (e.g. `<link href="...">`, `<img src="...">`)

A caveat of this approach is that hitting an endpoint from the browser address bar (as one might do during development) will include the header on an endpoint that isn't meant to be server-side rendered, and similarly, hitting a page via `curl` or similar tool without the header will not trigger server-side rendering correctly.

### Serialization and deserialization

Sometimes it's useful to share information from the server to the client.

The mechanism to do it is similar to the one above: use the `html` template tag to sanitize the interpolated data.

On the browser, we use `unescape` to get the original data.

```js
import {html, unescape} from 'fusion-core';

export default () => (ctx, next) => {
  if (__NODE__) {
    const data = {
      /* some data */
    };
    ctx.template.head.push(
      html`<meta id="__MY_DATA__" content="${JSON.stringify(data)}">`
    );
  } else {
    const data = JSON.parse(
      unescape(document.getElementById('__MY_DATA__').content)
    );
  }
  return next();
};
```
