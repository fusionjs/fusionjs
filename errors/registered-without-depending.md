##### Registered without depending

```
Error: Registered token without depending on it: TOKEN_NAME
```

This exception is thrown when a value is registered to a token which neither
appears in a plugin's `deps` nor is enhanced with `app.enhance`. Note that the
value we refer to here means any value that is not a plugin (created by calling
`createPlugin`).

Commonly this happens when you register a value like server-side config in both
the browser and server environments, when really it should only be registered
in the server because the only plugins that use it are server plugins. Wrap the
`app.register` call in a code fence to fix the error.

```js
if (__NODE__) {
  app.register(ConfigToken, mySecretConfig);
}
```

You can see that this error prevents accidentally leaking configuration to the
client.

This error could also be thrown if no plugins in either environment depend on
the token, but you need to use Fusion.js' DI system to store a value for use in
your application. In most cases, you should not need to do this, however if you
are sure you want to, you can get around this by wrapping the value in a plugin
to prevent the exception from being thrown.

```js
app.register(ValueToken, createPlugin({
  provides: () => myValue,
}));
```

If you do not need to access the value by associating it with a token, there
should be no reason to use the Fusion.js DI system for it. It is recommended to
import and use the value directly in your application.
