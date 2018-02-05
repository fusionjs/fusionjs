# fusion-plugin-i18n-react

[![Build status](https://badge.buildkite.com/fd8fcdba7b74ed2e6dcbca1b5c4998797b400f536029c45483.svg?branch=master)](https://buildkite.com/uberopensource/fusion-plugin-i18n-react)

Adds I18n (Internationalization) support to a FusionJS app.

This plugin looks for translations in the `./translations` folder. Translations for each language are expected to be in a JSON file with a locale as a filename, for example, for US english, translations should be in `./translations/en-US.json`

For date i18n, consider using [date-fns](https://date-fns.org/)

---

### Installation

```sh
yarn add fusion-plugin-i18n-react
```

---

### Example

```js
// src/main.js
import React from 'react';
import App from 'fusion-react';
import I18n, {I18nToken, I18nLoaderToken, createI18nLoader} from 'fusion-plugin-i18n-react';
import {FetchToken} from 'fusion-tokens';
import fetch from 'unfetch';
import Hello from './hello';

export default () => {
  const app = new App(<div></div>);

  app.register(I18nToken, I18n);
  __NODE__
    ? app.register(I18nLoaderToken, createI18nLoader())
    : app.register(FetchToken, fetch);

  app.register(Hello);

  return app;
}

// src/hello.js
import {I18nToken} from 'fusion-plugin-i18n-react';

export default withDependencies({I18n: I18nToken})({I18n}) => (ctx, next) => {
  // use the service
  if (__NODE__ && ctx.path === '/hello') {
    const i18n = I18n(ctx);
    ctx.body = {
      message: i18n.translate('test', {name: 'world'}), // hello world
    }
  }
  return next();
}

// translations/en-US.json
{
  test: "hello ${name}"
}
```

##### Custom translations loader example

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
import {I18nToken} from 'fusion-plugin-i18n-react';

export default withDependencies({I18n: I18nToken})(({I18n}) => {
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

#### Higher order component

```js
import React from 'react';
import {Translate, withTranslations} from 'fusion-plugin-i18n-react';

export default withTranslations(['test'])(({translate}) => {
  return <div>{translate('test', {name: 'world'})}</div>;
});
```

#### React component

```js
import React from 'react';
import {Translate, withTranslations} from 'fusion-plugin-i18n-react';

export default () => {
  return <Translate id="test" data={{name: 'world'}} />);
});
```

### Examples of translation files

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
  "HomeHeader": "Benvindo!",
  "Greeting": "Olá, ${name}"
}
```

Usage:

```js
<Translate id="HomeHeader" />
<Translate id="Greeting" data={{name: user.name}} />
```

---

### API

#### Dependency registration

```js
import {I18nLoaderToken, HydrationStateToken} from 'fusion-plugin-i18n';
import {FetchToken} from 'fusion-tokens';

__NODE__ && app.register(I18nLoaderToken, I18nLoader);
__BROWSER__ && app.register(FetchToken, fetch);

// some-test.js
__BROWSER__ && app.register(HydrationStateToken, hydrationState);
```

##### Optional dependencies

Name | Type | Default | Description
-|-|-|-
`I18nLoaderToken` | `{from: (ctx: Context) => ({locale: string, translations: Object<string, string>})}` | `createI18nLoader()` | A function that provides translations.  `ctx: {headers: {'accept-language': string}}` is a Koa context object.  Server-side only.
`HydrationStateToken` | `{chunks: Array, translations: Object}` | `undefined` | Sets the hydrated state in the client, and can be useful for testing purposes.  Browser only.
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
import {I18nLoaderToken, createI18nLoader} from 'fusion-plugin-i18n-react';

app.register(I18nLoaderToken, createI18nLoader());

// translations/en-US.json
{
  "some-translation-key": "hello",
}
```

`const loader = createI18nLoader()`

- `loader: (ctx) => ({locale, translations})` - A function that loads appropriate translations and locale information given an HTTP request context
  - `ctx: FusionContext` - Required. A [FusionJS context](https://github.com/fusionjs/fusion-core#context) object.
  - `locale: Locale` - A [Locale](https://www.npmjs.com/package/locale)
  - `translations: Object` - A object that maps translation keys to translated values for the given locale

#### React component

It's recommended that you use the React component rather than the HOC

```js
import {Translate} from 'fusion-plugin-i18n-react';

<Translate id="key" data={interpolations} />
```

- `key: string` - Required. Must be a hard-coded value. This plugin uses a babel transform, i.e you cannot pass a value via JSX interpolation.
- `interpolations: Object` - Optional. Replaces `${value}` interpolation placeholders in a translation string with the property of the specified name

#### Higher order component

It's recommended that you use the React component rather than the HOC

```js
import {withTranslations} from 'fusion-plugin-i18n-react';

const TranslatedComponent = withTranslations(['key'])(Component)
```

Note: the `withTranslations` function expects an array of strings. This plugin uses a babel transform and the argument to this function must be an inline value, i.e. you cannot pass a variable.

The original `Component` receives a prop called `{translate}`

- `translate: (key: string, interpolations: Object) => string` - returns the translation for the given key, with the provided interpolations
