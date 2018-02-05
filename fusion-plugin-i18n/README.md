# fusion-plugin-i18n

[![Build status](https://badge.buildkite.com/3f2d84d5538d87a19677f5d79304ac46a8a67f970520d13884.svg?branch=master)](https://buildkite.com/uberopensource/fusion-plugin-i18n)

Adds I18n (Internationalization) support to a FusionJS app

For date i18n, consider using [date-fns](https://date-fns.org/)

If you're using React, you should use [`fusion-plugin-i18n-react`](https://github.com/fusionjs/fusion-plugin-i18n-react) instead of this package.

---

### Installation

```sh
yarn add fusion-plugin-i18n
```

---

### Example

```js
// src/main.js
import React from 'react';
import App from 'fusion-react';
import I18n, {I18nToken, I18nLoaderToken, createI18nLoader} from 'fusion-plugin-i18n';
import {FetchToken} from 'fusion-tokens';
import fetch from 'unfetch';

export default () => {
  const app = new App(<div></div>);

  app.register(I18nToken, I18n);
  __NODE__
    ? app.register(I18nLoaderToken, createI18nLoader());
    : app.register(FetchToken, fetch);

  app.middleware({I18n: I18nToken}, ({I18n}) => {
    return (ctx, next) => {
      if (__NODE__ && ctx.path === '/hello') {
        const i18n = I18n.from(ctx);
        ctx.body = {
          message: i18n.translate('test', {name: 'world'}), // hello world
        }
      }
      return next();
    }
  });

  return app;
}
// translations/en_US.json
{
  "test": "hello ${name}"
}
```

##### Custom translations loader example

```js
// src/main.js
import React from 'react';
import App from 'fusion-react';
import I18n, {I18nToken, I18nLoaderToken} from 'fusion-plugin-i18n';
import {FetchToken} from 'fusion-tokens';
import fetch from 'unfetch';
import I18nLoader from './translations';

export default () => {
  const app = new App(<div></div>);

  app.register(I18nToken, I18n);
  __NODE__
    ? app.register(I18nLoaderToken, I18nLoader);
    : app.register(FetchToken, fetch);

  // ....

  return app;
}

// src/translation-loader.js
import {Locale} from 'locale';

const translationData = {
  'en_US': {
    test: "hello ${name}"
  }
}

export default (ctx) => {
  // locale could be determined in different ways,
  // e.g. from ctx.headers['accept-language'] or from a /en_US/ URL
  const locale = new Locale('en_US');
  const translations = translationData[locale];
  return {locale, translations};
}
```

---

### API

#### Dependency registration

```js
import {I18nLoaderToken, HydrationStateToken} from 'fusion-plugin-i18n';
import {FetchToken} from 'fusion-tokens';

__NODE__ && app.register(I18nLoaderToken, I18nLoader);
__BROWSER__ && app.register(HydrationStateToken, hydrationState);
__BROWSER__ && app.register(FetchToken, fetch);
```

##### Optional dependencies

Name | Type | Default | Description
-|-|-|-
`I18nLoaderToken` | `{from: (ctx: Context) => ({locale: string, translations: Object<string, string>})}` | `createI18nLoader()` | A function that provides translations.  `ctx: {headers: {'accept-language': string}}` is a Koa context object.  Server-side only.
`HydrationStateToken` | `{chunks: Array, translations: Object}` | `undefined` | Sets the hydrated state in the client.  Browser only.
`FetchToken` | `(url: string, options: Object) => Promise` | `window.fetch` | A [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) implementation.  Browser-only.

#### Factory

`const i18n = I18n.from(ctx)`

- `ctx: FusionContext` - Required. A [FusionJS context](https://github.com/fusionjs/fusion-core#context) object.

#### Instance methods

```js
const translation = i18n.translate(key, interpolations)
```

- `key: string` - A translation key. When using `createI18nLoader`, it refers to a object key in a translation json file.
- `interpolations: object` - A object that maps an interpolation key to a value. For example, given a translation file `{"foo": "${bar} world"}`, the code `i18n.translate('foo', {bar: 'hello'})` returns `"hello world"`.
- `translation: string` - A translation, or `key` if a matching translation could not be found.

#### Server-side loader

This plugin has a simple loader implementation that looks for files in a `./translations` directory. Files should be named after their locales.

```js
import {I18nLoaderToken, createI18nLoader} from 'fusion-plugin-i18n';

app.register(I18nLoaderToken, createI18nLoader());

// translations/en_US.json
{
  "some-translation-key": "hello",
}
```

`const loader = createI18nLoader()`

- `loader.from: (ctx) => ({locale, translations})` - A function that loads appropriate translations and locale information given an HTTP request context
  - `ctx: FusionContext` - Required. A [FusionJS context](https://github.com/fusionjs/fusion-core#context) object.
  - `locale: Locale` - A [Locale](https://www.npmjs.com/package/locale)
  - `translations: Object` - A object that maps translation keys to translated values for the given locale
