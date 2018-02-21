# Creating providers

When using services in React/Preact, it's good practice to use providers and HOCs that communicate via `context` because having global service instances floating around makes testing harder.

The Fusion.js plugin architecture makes it possible to automatically install providers when a plugin is registered. This, in turn, means all logic related to a service - including integration with React/Preact - can be colocated into a single plugin.

You can create providers and HOCs by implementing their respective patterns manually or by using the [`fusion-react`](https://github.com/fusionjs/fusion-react) package.

If you created a provider manually and you want to install it into a plugin, wrap `ctx.element` with it:

```js
import React from 'react';
import PropTypes from 'prop-types';

class GreetingProvider extends React.Component {
  getChildContext() {
    return {
      greet() {return 'hello'}
    };
  }
  render() {
    return React.Children.only(this.props.children);
  }
}
GreetingProvider.childContextTypes = {
  ...(GreetingProvider.childContextTypes || {}),
  greet: PropTypes.function.isRequired,
};

export default () => (ctx, next) => {
  if (ctx.element) {
    ctx.element = <GreetingProvider>{ctx.element}</GreetingProvider>;
  }
}
```

The `ctx.element` property is a Fusion.js-specific value that holds the root element of an application when a request is server-side rendered. The `if (ctx.element)` check is important because we don't want to do server-side rendering related things for data endpoints, asset requests, etc.

Also note that we don't need an `if (__NODE__)` code fence as we want the provider to exist both in server and browser.
