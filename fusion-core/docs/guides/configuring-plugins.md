# Configuring plugins

Plugins can be configured through dependency injection. 

```js
// greeting-plugin.js
import {createPlugin} from 'fusion-core';
import {LoggerToken, createToken} from 'fusion-tokens';

export const GreetingNameToken = createToken('GreetingNameToken');

export default createPlugin({
  deps: {
    logger: LoggerToken, 
    name: GreetingNameToken,
  }, 
  provides: ({logger, name}) => {
    return {
      hello: () => logger.info(`hello ${name}`),
    };
  }
});
```

```js
// src/main.js
import App from 'fusion-react';
import GreetingPlugin, {GreetingNameToken} from 'fusion-plugin-greeting';
import ConsoleLogger from 'fusion-plugin-console-logger';
import {LoggerToken, createToken} from 'fusion-tokens';

export default () => {
  const app = new App();
  app.register(GreetingToken, GreetingPlugin);
  app.register(LoggerToken, ConsoleLogger);
  app.register(GreetingNameToken, 'Hello!');
}
```

In the above example, the hello-world-plugin declares a dependency on some implementation of a logger. Then at registration
time, the user provides a ConsoleLogger plugin as the implementation of the LoggerToken. Notice how order of registration
here does not matter. In other words, the ConsoleLogger plugin can be registered after the HelloWorldPlugin even though
the HelloWorldPlugin depends on a logger.
