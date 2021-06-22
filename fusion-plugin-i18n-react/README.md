# fusion-plugin-i18n-react

[![Build status](https://badge.buildkite.com/7a82192275779f6a8ba81f7d4a1b0d294256838faa1dfdf080.svg?branch=master)](https://buildkite.com/uberopensource/fusionjs)

Adds I18n (Internationalization) string support to a Fusion.js app.

This plugin looks for translations in the `./translations` folder by default. Translations for each language are expected to be in a JSON file with a [locale](https://www.npmjs.com/package/locale) as a filename. For example, for U.S. English, translations should be in `./translations/en-US.json`. Language tags are dictated by your browser, and likely follow the [RFC 5646](https://tools.ietf.org/html/rfc5646) specification.

For date I18n, consider using [date-fns](https://date-fns.org/).

---

### Table of contents

* [Installation](#installation)
* [Usage](#usage)
  * [React component](#react-component)
  * [Higher order component](#higher-order-component)
  * [React hook](#react-hook)
  * [Examples of translation files](#examples-of-translation-files)
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
  * [React component](#react-component-1)
  * [Higher order component](#higher-order-component-1)
  * [React hook](#react-hook-1)
* [Other examples](#other-examples)
  * [Custom translations loader example](#custom-translations-loader-example)

---

### Installation

```sh
yarn add fusion-plugin-i18n-react
```

---

### Usage

#### React component

We recommend using the supplied `Translate` component for static translations.

```js
import React from 'react';
import {Translate} from 'fusion-plugin-i18n-react';

export default () => {
  return <Translate id="test" data={{name: 'world'}} />;
};
```

#### Higher order component

A higher order component is provided to allow passing translations to third-party or native components. If you are using the `translate` function directly, be aware that you can only pass in a string literal to this function. This plugin uses a babel transform and non-string literals (e.g. variables) will break.

```js
import React from 'react';
import {withTranslations} from 'fusion-plugin-i18n-react';

export default withTranslations(['test'])(({translate}) => {
  return <input placeholder={translate('test', {name: 'world'})} />;
});
```

#### React Hook

The React hook is currently the only way that dynamic translations are supported. `useTranslations` returns a function that can be used to dynamically translate a template string. Be aware that fusion-cli with throw an error if you attempt to pass a variable or a template string that is not hinted (i.e. has some unchanging parts). Try to use dynamic translations only when completely necessary because all translations that match this dynamic template string will be transferred to the client, contributing to an increase in overall application size.

```js
import React from 'react';
import {useTranslations} from 'fusion-plugin-i18n-react';

export default (props) => {
  const translate = useTranslations();
  return <span>{translate(`cities.${props.city}`)}</span>;
};
```

#### Examples of translation files

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

Usage:

```js
<Translate id="HomeHeader" />
<Translate id="Greeting" data={{name: user.name}} />
```

---

### Setup

```js
// src/main.js
import React from 'react';
import App from 'fusion-react';
import I18n, {
  I18nToken,
  I18nLoaderToken,
  createI18nLoader,
} from 'fusion-plugin-i18n-react';
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
import {I18nLoaderToken} from 'fusion-plugin-i18n-react';
```

A function that provides translations. Optional. Server-side only.

###### Types

```js
type I18nLoader = {
  from: (ctx: Context) => {locale: string | Locale, translations: Object},
};
```

* `loader.from: (ctx) => ({locale, translations})` -
  * `ctx: FusionContext` - Required. A [Fusion.js context](https://github.com/fusionjs/fusionjs/tree/master/fusion-core#context) object.
  * `locale: string | Locale` - The default i18n loader returns the [Locale](https://www.npmjs.com/package/locale) class here, but strings are also supported if you write your own loader.
  * `translations: Object` - A object that maps translation keys to translated values for the given locale

###### Default values

If no loader is provided, the default loader will read translations from `./translations/{locale}.json`. See [src/loader.js](https://github.com/fusionjs/fusion-plugin-i18n/blob/master/src/loader.js#L12) for more details.

##### `HydrationStateToken`

```js
import {HydrationStateToken} from 'fusion-plugin-i18n-react';
```

Sets the hydrated state in the client, and can be useful for testing purposes. Optional. Browser only.

###### Types

```js
type HydrationState = {
  chunks: Array,
  translations: Object,
};
```

###### Default values

If no hydration state is provided, this will be an empty object (`{}`) and have no effect.

##### `FetchToken`

```js
import {FetchToken} from 'fusion-tokens';
```

A [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) implementation. Browser-only.

###### Types

```js
type Fetch = (url: string, options: Object) => Promise<Response>;
```

* `url: string` - Required. Path or URL to the resource you wish to fetch.
* `options: Object` - Optional. You may optionally pass an `init` options object as the second argument. See [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request) for more details.
* `[return]: Promise<Request>` - Return value from fetch. See [Response](A function that loads appropriate translations and locale information given an HTTP request context) for more details.

###### Default values

If no fetch implementation is provided, [`window.fetch`](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch) is used.

#### Service API

```js
const translations: string = i18n.translate(
  key: string,
  interpolations: Object
);
```

* `key: string` - A translation key. When using `createI18nLoader`, it refers to a object key in a translation json file.
* `interpolations: object` - A object that maps an interpolation key to a value. For example, given a translation file `{"foo": "${bar} world"}`, the code `i18n.translate('foo', {bar: 'hello'})` returns `"hello world"`.
* `translation: string` - A translation, or `key` if a matching translation could not be found.

#### React component

If you are using React, we recommend using the supplied `Translate` component.

```js
import {Translate} from 'fusion-plugin-i18n-react';

<Translate id="key" data={interpolations} />;
```

* `key: string` - Required. Must be a hard-coded value. This plugin uses a babel transform, i.e you cannot pass a value via JSX interpolation.
* `interpolations: Object` - Optional. Replaces `${value}` interpolation placeholders in a translation string with the property of the specified name.

#### Higher order component

A higher order component is provided to allow passing translations to third-party or native components. If you are using the `translate` function directly, be aware that you can only pass in a string literal to this function. This plugin uses a babel transform and non-string literals (e.g. variables) will break.

```js
import {withTranslations} from 'fusion-plugin-i18n-react';

const TranslatedComponent = withTranslations(['key'])(Component);
```

Be aware that the `withTranslations` function expects an array of string literals. This plugin uses a babel transform and the argument to this function must be an inline value, i.e. you cannot pass a variable.

The original `Component` receives a prop called `{translate}` and the `{localeCode}`.

**Types**

```js
type TranslateProp = {
  translate: (key: string, interpolations: Object) => string,
  localeCode: string
};
type WithTranslations = (
  translationKeys: Array<string>
) => (React.Component<Props>) => React.Component<Props & TranslateProp>;
```

* `translationKeys: Array<string>` - list of keys with which to provide translations for.
* `translate: (key: string, interpolations: Object) => string` - returns the translation for the given key, with the provided interpolations.
* `localeCode: string = 'en_US'` - the current `localeCode` we are tranlating to. Defaults to `en_US`.

#### React hook

The React hook is currently the only way that dynamic translations are supported. `useTranslations` returns a function that can be used to dynamically translate a template string. Be aware that fusion-cli with throw an error if you attempt to pass a variable or a template string that is not hinted (i.e. has some unchanging parts). Try to use dynamic translations only when completely necessary because all translations that match this dynamic template string will be transferred to the client, contributing to an increase in overall application size.

Given this usage of `useTranslations`:

```js
import {useTranslations} from 'fusion-plugin-i18n-react';

export default () => {
  const translate = useTranslations();
  translate(`static.${dynamicValue}`);
};
```

And given this translations json file:

```json
{
  "static.foo": "foo",
  "static.bar": "bar",
  "static.baz": "baz"
}
```

All 3 translations will be loaded on the client.

The `translate` function returned from `useTranslations` has the same signature as the [service api](#service-api).

* `key: string` - Required. May be a *hinted* template string or a hard-coded string literal. This plugin uses a babel transform to perform static analysis on this value.
* `interpolations: Object` - Optional. Replaces `${value}` interpolation placeholders in a translation string with the property of the specified name.

---

### Other examples

#### Custom translations loader example

```js
// src/main.js
import React from 'react';
import App from 'fusion-react';
import I18n, {I18nToken, I18nLoaderToken} from 'fusion-plugin-i18n-react';
import {FetchToken} from 'fusion-tokens';
import fetch from 'unfetch';
import Hello from './hello';
import I18nLoader from './translations';

export default () => {
  const app = new App(<div></div>);

  app.register(I18nToken, I18n);
  __NODE__
    ? app.register(I18nLoaderToken, I18nLoader);
    : app.register(FetchToken, fetch);

  app.register(Hello);

  return app;
}

// src/hello.js
import {withServices} from 'fusion-react';
import {I18nToken} from 'fusion-plugin-i18n-react';

export default withServices({I18n: I18nToken})(({I18n}) => {
  return withMiddleware((ctx, next) => {
    if (__NODE__ && ctx.path === '/hello') {
      const i18n = I18n(ctx);
      ctx.body = {
        message: i18n.translate('test', {name: 'world'}), // hello world
      }
    }
    return next();
  });
});

// src/translation-loader.js
import {Locale} from 'locale';

const translationData = {
  'en-US': {
    test: "hello ${name}"
  }
}

export default (ctx) => {
  // locale could be determined in different ways,
  // e.g. from ctx.headers['accept-language'] or from a /en-US/ URL
  const locale = new Locale('en-US');
  const translations = translationData[locale];
  return {locale, translations};
}
```
