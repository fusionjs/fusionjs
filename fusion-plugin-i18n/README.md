# fusion-plugin-i18n

[![Build status](https://badge.buildkite.com/7a82192275779f6a8ba81f7d4a1b0d294256838faa1dfdf080.svg?branch=master)](https://buildkite.com/uberopensource/fusionjs)

Adds I18n (Internationalization) string support to a Fusion.js app.

This plugin looks for translations in the `./translations` folder by default. Translations for each language are expected to be in a JSON file with a [locale](https://www.npmjs.com/package/locale) as a filename. For example, for U.S. English, translations should be in `./translations/en-US.json`. Language tags are dictated by your browser, and likely follow the [RFC 5646](https://tools.ietf.org/html/rfc5646) specification.

If you're using React, you should use [`fusion-plugin-i18n-react`](https://github.com/fusionjs/fusion-plugin-i18n-react) instead of this package.

---

### Table of contents

* [Installation](#installation)
* [Usage](#usage)
  * [Simple middleware](#simple-middleware)
* [Setup](#setup)
* [API](#api)
  * [Registration API](#registration-api)
    * [`I18n`](#i18n)
    * [`I18nToken`](#i18ntoken)
  * [Dependencies](#dependencies)
    * [`I18nLoaderToken`](#i18nloadertoken)
    * [`HydrationStateToken`](#hydrationstatetoken)
    * [`FetchToken`](#fetchtoken)
  * [Service API](#service-api)
* [Other examples](#other-examples)
  * [Custom translations loader example](#custom-translations-loader-example)

---

### Installation

```sh
yarn add fusion-plugin-i18n
```

---

### Usage

#### Simple middleware

The plugin provides a programmatic interface which exposes `translate`. See [Service API](#service-api) for more details.

```js
// src/some-middleware-plugin.js
import {createPlugin} from 'fusion-core';

export default createPlugin({
  deps: {I18n: I18nToken},
  middleware: ({I18n}) => {
    return (ctx, next) => {
      if (__NODE__ && ctx.path === '/some-path') {
        const i18n = I18n.from(ctx);
        ctx.body = {
          message: i18n.translate('test', {name: 'world'}), // hello world
        };
      }
      return next();
    };
  },
});
```

The default loader expects translation files to live in `./translations/{locale}`.

`./translations/en-US.json`

```json
{
  "HomeHeader": "Welcome!",
  "Greeting": "Hello, ${name}"
}
```

`./translations/pt-BR.json`

```json
{
  "HomeHeader": "Bem-vindo!",
  "Greeting": "Olá, ${name}"
}
```

---

### Setup

```js
// src/main.js
import App from 'fusion-core';
import I18n, {
  I18nToken,
  I18nLoaderToken,
  createI18nLoader,
} from 'fusion-plugin-i18n';
import {FetchToken} from 'fusion-tokens';
import fetch from 'unfetch';

export default () => {
  const app = new App(<div />);

  app.register(I18nToken, I18n);
  __NODE__
    ? app.register(I18nLoaderToken, createI18nLoader())
    : app.register(FetchToken, fetch);

  return app;
};
```

---

### API

#### Registration API

##### `I18n`

```js
import I18n from 'fusion-plugin-i18n-react';
```

The i18n plugin. Typically, it should be registered to [`I18nToken`](#i18ntoken). Provides the [i18n service](#service-api)

##### `I18nToken`

```js
import {I18nToken} from 'fusion-plugin-i18n-react';
```

The canonical token for the I18n plugin. Typically, it should be registered with the [`I18n`](#i18n) plugin.

#### Dependencies

##### `I18nLoaderToken`

```js
import {I18nLoaderToken} from 'fusion-plugin-i18n';
```

A function that provides translations. Optional. Server-side only.

###### Type

```js
type I18nLoader = {
  from: (ctx: Context) => {locale: string | Locale, translations: {[string]: string},
};
```

* `loader.from: (ctx) => ({locale, translations})` -
  * `ctx: FusionContext` - Required. A [Fusion.JS context](https://github.com/fusionjs/fusionjs/tree/master/fusion-core#context) object.
  * `locale: string | Locale` - The default i18n loader returns the [Locale](https://www.npmjs.com/package/locale) class here, but strings are also supported if you write your own loader.
  * `translations: {[string]: string}` - A object that maps translation keys to translated values for the given locale

###### Default value

If no loader is provided, the default loader will read translations from `./translations/{locale}.json`. See [src/loader.js](https://github.com/fusionjs/fusion-plugin-i18n/blob/master/src/loader.js#L12) for more details.

##### `HydrationStateToken`

```js
import {HydrationStateToken} from 'fusion-plugin-i18n';
```

Sets the hydrated state in the client, and can be useful for testing purposes. Optional. Browser only.

###### Type

```js
type HydrationState = {
  chunks: Array<string | number>,
  translations: {[string]: string},
};
```

###### Default value

If no hydration state is provided, this will be an empty object (`{}`) and have no effect.

##### `FetchToken`

```js
import {FetchToken} from 'fusion-tokens';
```

A [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) implementation. Browser-only.

###### Type

```js
type Fetch = (url: string, options: Object) => Promise<Response>;
```

* `url: string` - Required. Path or URL to the resource you wish to fetch.
* `options: Object` - Optional. You may optionally pass an `init` options object as the second argument. See [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request) for more details.
* `[return]: Promise<Request>` - Return value from fetch. See [Response](A function that loads appropriate translations and locale information given an HTTP request context) for more details.

###### Default value

If no fetch implementation is provided, [`window.fetch`](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch) is used.

#### Service API

```js
const translation: string = i18n.translate(
  key: string,
  interpolations: {[string]: string}
);
```

* `key: string` - A translation key. When using `createI18nLoader`, it refers to a object key in a translation json file.
* `interpolations: object` - A object that maps an interpolation key to a value. For example, given a translation file `{"foo": "${bar} world"}`, the code `i18n.translate('foo', {bar: 'hello'})` returns `"hello world"`.
* `translation: string` - A translation, or `key` if a matching translation could not be found.

---

### Other examples

#### Custom translations loader example

```js
// src/main.js
import App from 'fusion-core';
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

#### Custom locale resolver

If you want to use the default loader, but want to provide a custom locale resolver, you can pass it into `createI18nLoader`

```js
// src/main.js
import App from 'fusion-core';
import I18n, {createI18nLoader, I18nToken, I18nLoaderToken} from 'fusion-plugin-i18n';
import {FetchToken} from 'fusion-tokens';
import fetch from 'unfetch';

// use custom locale header instead of default
const myLocaleResolver = (ctx) => ctx.headers['my-locale-header'];

export default () => {
  const app = new App(<div></div>);

  app.register(I18nToken, I18n);
  __NODE__
    ? app.register(I18nLoaderToken, createI18nLoader(myLocaleResolver));
    : app.register(FetchToken, fetch);

  // ....

  return app;
}
```
