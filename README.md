<h1 align="center">
  <a href="https://fusionjs.com/">FUSION.JS</a>
</h1>

<p align="center">
  Modern framework for fast, powerful React apps
</p>

<p align="center">
  <a href="https://buildkite.com/uberopensource/fusionjs"><img alt="Build status" src="https://badge.buildkite.com/4c8b6bc04b61175d66d26b54b1d88d52e24fecb1b537c54551.svg?branch=master"></a>
  <a href="https://www.npmjs.com/package/fusion-core"><img alt="fusion-core Downloads" src="https://img.shields.io/npm/dm/fusion-core.svg?maxAge=43200&label=downloads"></a>
</p>

## What is it?

> **fu·sion** — *noun*
>
> The process or result of joining two or more things together to form a single entity.

**Fusion.js**, Uber’s open source universal web framework, represents the fusion of the client and the server. It's geared for server-side rendering out of the box, and its plugin-driven architecture allows for complex frontend and backend logic to be encapsulated in a single plugin:

```js
import App from 'fusion-react';
import Router from 'fusion-plugin-react-router';

export default () => {
  const app = new App(<div>...</div>);

  /*
  One line of code sets up everything you need for routing:
  - Server rendering
  - React Providers on both server and browser
  - Bundle splitting integration
  - Hot module reloading support
  */
  app.register(Router);

  return app;
}
```

We initially [built Fusion.js](https://eng.uber.com/fusionjs/) to make our own websites easier to maintain, but were so impressed with the benefits that we decided to offer it to the community as an open source project!

## Try it out

If you're interested in giving Fusion a shot, [Getting started](https://fusionjs.com/docs/getting-started/) and [Core concepts](https://fusionjs.com/docs/learn-fusion/core-concepts) are great places to start.

## Contributing

This is a monorepo of all open source Fusion.js packages maintained using [rushjs](https://rushjs.io/). Take a look at [CONTRIBUTING.md](CONTRIBUTING.md) for info on how to develop in this repo.

## License

MIT
