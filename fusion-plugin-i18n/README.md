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
import Internationalization from 'fusion-plugin-i18n';
import fetch from 'unfetch';
import Hello from './hello';
import TranslationsLoader from './translation-loader';

export default () => {
  const app = new App(<div></div>);

  const I18n = app.plugin(Internationalization, __BROWSER__ ? {fetch} : {TranslationsLoader});

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

// src/translation-loader.js
import {Plugin} from 'fusion-core';

const translations = {
  'en-US': {
    test: "hello ${name}"
  }
}

export default () => {
  return new Plugin {
    Service: class {
      constructor(ctx) {
        // locale could be determined in different ways,
        // e.g. from ctx.headers['accept-headers'] or from a /en-US/ URL
        this.locale = 'en-US';
        this.translations = translations[this.locale];
      }
    }
  }
}
```

---

### API

#### Instance methods

```js
const {translate} = app.plugin(Internationalization, __BROWSER__ ? {fetch} : {TranslationsLoader}).of();
```

- `translate: (key: string, interpolations: Object) => string`
