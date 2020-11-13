##### Duplicate token names

```
Missing registration for token "TOKEN_NAME". Other tokens with this name have been registered
```

This error is a special case of [missing
registration](https://github.com/fusionjs/fusionjs/tree/master/errors/missing-registration.md).

During the plugin resolution phase of Fusion.js startup, the dependency graph
could not be resolved because a dependency token was not found.

This is a special case because the missing token has the same name as one or
more other registered tokens. Since it is unusual for multiple tokens to share
the same name, it is likely that your package manager failed to de-duplicate
a dependency.

You can mitigate this issue by using your package manager to see if the package
that provides this token is installed more than once.

```
yarn why my-fusion-plugin
npm ls my-fusion-plugin
```

Use a yarn resolution or upgrade the package to a compatible version to
consolidate versions.
