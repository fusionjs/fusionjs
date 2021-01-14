##### Missing registration

```
Missing registration for token "TOKEN_NAME". Token is required dependency of plugins registered to TOKEN_A, TOKEN_B
```

The Fusion.js dependency injection system requires that all plugins be registered
at the top-level. This forces you to register transitive dependencies
yourself. That is, if you register a plugin that depends on another token, you
must not forget to register that token.

Fix this error by registering the token listed.
