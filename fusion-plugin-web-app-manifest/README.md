# fusion-plugin-web-app-manifest

[![Build status](https://badge.buildkite.com/7a82192275779f6a8ba81f7d4a1b0d294256838faa1dfdf080.svg?branch=master)](https://buildkite.com/uberopensource/fusionjs)

Handles creating and returning a Web App Manifest(_manifest.json_) file for your Fusion app.

---

### Table of contents

* [Installation](#installation)
* [Setup](#setup)

---

### Installation

```sh
yarn add fusion-plugin-web-app-manifest
```

---

### Setup
Create an `Object` to use for your `manifest.json` content.
```js
// src/manifest.js
import { assetUrl } from 'fusion-core'

export default {
  short_name: 'Fusion App',
  name: 'Fusion App',
  start_url: '/',
  background_color: '#041725',
  display: 'standalone',
  theme_color: '#041725',
  icons: [
    {
      src: assetUrl('./icons/fusion-app-192.png'),
      type: 'image/png',
      size: '192x192',
    },
    {
      src: assetUrl('./icons/fusion-app-512.png'),
      type: 'image/png',
      size: '512x512',
    },
  ],
}
```
Register `WebAppManifestToken` with your manifest `Object` and register `WebAppManifestPlugin` for the `__NODE__` env.
```js
// src/main.js
import App from 'fusion-react'
import WebAppManifestPlugin, {
  WebAppManifestToken,
} from 'fusion-plugin-web-app-manifest'
import Manifest from './manifest
export default () => {
  const app = new App(root)
  if (__NODE__) {
    app.register(WebAppManifestToken, Manifest)
    app.register(WebAppManifestPlugin)
  }
  return app
}
```
