# Create Fusion.js App

[![Build status](https://badge.buildkite.com/7a82192275779f6a8ba81f7d4a1b0d294256838faa1dfdf080.svg?branch=master)](https://buildkite.com/uberopensource/fusionjs)

Creates a Fusion.js application using the command line.

## Usage

If you are using **Yarn**:

```
$ yarn create fusion-app <appName>
```

If you are using **npm**:

```
$ npx create-fusion-app <appName>
```

The tool will scaffold a new project and install all dependencies into the specified project folder. To start your project, just run `yarn dev`:

```
$ cd <appName>
$ yarn dev
```

Then, visit http://localhost:3000 to see your app.

## What's Included?

The scaffold is preconfigured to use React. It also comes with common plugins already registered:

* React router
* Styletron
* React helmet
* Universal events

## Included Scripts

**`yarn dev`**

Compiles and runs the application in development mode.

**`yarn lint`**

Runs eslint using the provided lint rules.

**`yarn test`**

Runs tests using Jest.

**`yarn build`**

Builds a development bundle.

**`yarn build-production`**

Builds a production bundle.

**`yarn start`**

Starts the application.

## Documentation

For more information, visit the Fusion.js documentation at https://fusionjs.com for basic information, how-to guides, and in depth references.
