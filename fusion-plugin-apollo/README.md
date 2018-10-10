# fusion-apollo

[![Build status](https://badge.buildkite.com/2ac76cfb209dae257969b7464a2c90834ed82705cfd5bfcc52.svg?branch=master)](https://buildkite.com/uberopensource/fusion-apollo)

Fusion.js entry point for React universal rendering with Apollo

Provides a Fusion.js application class that is pre-configured with React and Apollo universal rendering for applications leveraging GraphQL.

The App class from this package should be used when you want to perform both server and client rendering with GraphQL querying. This package will also provide initial state hydration on the client.

---

# Table of contents

- [Installation](#installation)
- [Usage](#usage)
- [API](#api)
  - [Registration API](#registration-api)
    - [`ApolloClientToken`](#apolloclienttoken)
    - [`ApolloContextToken`](#apollocontexttoken)
    - [`GraphQLSchemaToken`](#graphqlschematoken)
  - [App](#app)
  - [Provider](#providers)

---

### Installation

```sh
yarn add fusion-apollo
```

---

### Usage

```js
// ./src/main.js
import React from 'react';
import App, {ApolloClientToken} from 'fusion-apollo';
import ApolloClient from 'fusion-apollo-universal-client';

export default function() {
  const app = new App(<Hello />);
  app.register(ApolloClientToken, ApolloClient);
  return app;
}
```

### Loading GraphQL Queries/Schemas

fusion-apollo ships with a compiler plugin that lets you load graphql queries and schemas with the `gql` macro. 
This macro takes a relative path argument and returns the query/schema as a string. 

NOTE: Because this is a build time feature, the path argument must be a string literal. Dynamic paths are not supported.

```js
import {gql} from 'fusion-apollo';
const query = gql('./some-query.graphql');
const schema = gql('./some-schema.graphql');
```

---

### API

#### Registration API

##### ApolloClientToken

```js
import {ApolloClientToken} from 'fusion-apollo';
```

A plugin, which provides an instance of [Apollo Client](https://www.apollographql.com/docs/react/api/apollo-client.html), to be registered and used as within the Apollo Provider. You can use [fusion-apollo-universal-client](https://github.com/fusionjs/fusion-apollo-universal-client) as a barebones Apollo Client token.

###### Types

```flow
type ApolloClient<TInitialState> = (ctx: Context, initialState: TInitialState) => ApolloClientType;
```

##### ApolloContextToken

```js
import {ApolloContextToken} from 'fusion-apollo';
```

Allows registration of a context object which gets passed into every resolver. See the [Apollo Client context documentation](https://www.apollographql.com/docs/apollo-server/v2/essentials/data.html#context) for more details.

###### Types

```flow
type ApolloContext<T> = (ctx: Context => T) | T;
```

##### GraphQLSchemaToken

```js
import {GraphQLSchemaToken} from 'fusion-apollo';
```

Define the `GraphQLSchemaToken` when using a locally hosted GraphQL endpoint from within a Fusion.js application. Connect your schema to a Fusion.js server with [fusion-plugin-apollo-server](https://github.com/fusionjs/fusion-plugin-apollo-server). You can find an example schema in the [graphql-tools repo](https://github.com/apollographql/graphql-tools#example).

###### Types

```flow
type GraphQLSchema = string;
```

#### App

```js
import App from 'fusion-apollo';
```

A class that represents an application. An application is responsible for rendering (both virtual DOM and server-side rendering). The functionality of an application is extended via [plugins](https://github.com/fusionjs/fusion-core#plugin).

**Constructor**

```flow
const app: App = new App(el: ReactElement);
```

- `el: ReactElement` - a template root. In a React application, this would be a React element created via `React.createElement` or a JSX expression.

**app.(register|middleware|enhance|cleanup)**

See the [fusion-core app methods](https://github.com/fusionjs/fusion-core#app) for further information on provided methods. Fusion-apollo does not add additional app methods besides the inherited fusion-core methods.

#### gql

```js
import {gql} from 'fusion-apollo';
```

A macro for loading graphql queries and schemas. Takes a relative path string and returns the contents of the graphql schema/query as a string.

##### Types

```flow
type gql = (path: string): string
```

- `path: string` - Relative path to the graphql schema/query file. NOTE: This must be a string literal, dynamic paths are not supported.

---

#### Providers

As a convenience, fusion-apollo re-exports providers from fusion-react. You can find additional information on those as follows:

- [Provider](https://github.com/fusionjs/fusion-react/blob/master/README.md#provider)
- [ProviderPlugin](https://github.com/fusionjs/fusion-react/blob/master/README.md#providerplugin)
- [ProvidedHOC](https://github.com/fusionjs/fusion-react/blob/master/README.md#providedhoc)
