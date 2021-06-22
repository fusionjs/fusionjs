# Babel plugin

Before:

```
import("./foo.js")
```

After:

```
Object.defineProperty(import("./foo.js"), "__FUSION_IMPORT_METADATA__", {
  "value": {
    "version": 1,
    "origin": "path/to/src/file.js",
    "target": "./foo.js"
  }
});
```
