# fusion-plugin-react-helmet-async

[![Build status](https://badge.buildkite.com/3f2d84d5538d87a19677f5d79304ac46a8a67f970520d13884.svg?branch=master)](https://buildkite.com/uberopensource/fusion-plugin-react-helmet-async)

Allows adding content into the document head via a component driven api.

---

### Table of contents

* [Installation](#installation)
* [Usage](#usage)
* [Setup](#setup)

---

### Installation

```sh
yarn add fusion-plugin-react-helmet-async
```

---

### Usage

This plugin is a simple wrapper on the [`react-helmet-async`](https://github.com/NYTimes/react-helmet-async) module which handles
the context provider and server side code for you.

```js
import {Helmet} from 'fusion-plugin-react-helmet-async';

const app = (
  <App>
    <Helmet>
      <title>Hello World</title>
      <link rel="canonical" href="https://www.tacobell.com/" />
    </Helmet>
    <h1>Hello World</h1>
  </App>
);
```

---

### Setup

This module has no dependencies or configuration. Simply register the plugin.

```js
// src/main.js
import App from 'fusion-react';
import HelmetPlugin from 'fusion-plugin-react-helmet-async';
import Root from './components/root';
export default async function main() {
  const app = new App(<Root />);
  app.register(HelmetPlugin);
  return app;
}
```
