# fusion-plugin-i18n-react

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
import Internationalization from 'fusion-plugin-i18n-react';
import fetch from 'unfetch';
import Hello from './hello';

export default () => {
  const app = new App(<div></div>);

  const I18n = app.plugin(Internationalization, {fetch});

  app.plugin(Hello, {I18n});

  return app;
}

// src/hello.js
export default ({I18n}) => (ctx, next) => {
  // use the service
  if (__NODE__ && ctx.path === '/hello') {
    const i18n = I18n.of(ctx);
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

#### Instance methods

```js
const {translate} = app.plugin(Internationalization, {fetch}).of();
```

- `translate: (key: string, interpolations: Object) => string`

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
