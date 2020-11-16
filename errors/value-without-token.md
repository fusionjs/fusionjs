##### Value without token

```
Error: Cannot register VALUE without a token. Did you accidentally register a BROWSER/SERVER plugin on the SERVER/BROWSER?
```

For example, the error may look like this:

```
Error: Cannot register [object Object] without a token. Did you accidentally register a browser plugin on the server? 
```

This error says that you registered a value without supplying a token. This is
a useless operation in the Fusion.js dependency injection system. Plugins can
be registered without a token because they contain server middleware. However,
values have no such significance in DI, therefore they must be registered with
a token in order to be referenced elsewhere.


###### The Most Common Case

Some non-universal plugins are authored in this way:

```
const MyServerPlugin = __NODE__ ? createPlugin({...}) : null;
```

Plugins like these should not be registered universally. For example, in the
above case, we would only want to register this plugin on the server.

```
if (__NODE__) {
  app.register(MyServerPlugin);
}
```

If we instead registered the plugin without the `__NODE__` code fence, we would
encounter the following error in the browser:

```
Error: Cannot register null without a token. Did you accidentally register a server plugin on the browser?
```

You can mitigate this issue by registering the plugin behind the appropriate code
fence.
