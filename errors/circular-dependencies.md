##### Circular dependencies

Circular dependencies are not allowed in the Fusion.js dependency injection
system.

If you have two plugins that depend on each other, whether directly or
transitively, you will see this error:

```
Error: Cannot resolve circular dependency: TOKEN_NAME
```

This issue can only be resolved within your plugins. Either remove the need for
interdependencies, use alternate plugins, or if these are 3rd party plugins,
reach out to the plugin authors with how to reproduce this conflict.
