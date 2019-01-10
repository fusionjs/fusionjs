# Progressively enhanced bundles

Fusion compiles two client bundles, an ES2015+ build for modern browsers and an ES5 build for legacy browsers. This allows for a lightweight build with fewer polyfills and transpilation artifacts to be served to browsers that support those features, improving load, parse, and execution performance.

Based on user agent, Fusion serves the browser the appropriate build.

The following browsers are served the modern build:
- Chrome 61+
- Safari 12+
- Firefox 60+

All other user agents are served the ES5 build.

## Legacy builds in development

By default, `fusion dev` will only compile the modern build, ostensibly because development is primarily done using a modern browser with the latest developer tools, etc. This results in faster builds because the legacy bundle is skipped. An error page will be shown when attempting to visit a running app in development with a legacy browser when the legacy build was skipped.

To opt-out of this behavior when developing with a legacy browser, use `fusion dev --forceLegacyBuild`.

This behavior only happens with `fusion dev`; both modern and legacy builds are compiled when running `fusion build`.



## FAQ

### What about Edge?

ChakraCore has [a few bugs](https://github.com/babel/babel/issues/8019) related to [native ES6 classes](https://github.com/Microsoft/ChakraCore/issues/5030) and [subclassing](https://github.com/Microsoft/ChakraCore/issues/4663) that requires transpilation to ES5 as a workaround. Rather than degrade compliant browsers, Edge is served the legacy bundle. Given that ES6 classes is one of the costlier features to polyfill/transpile and Edge market share is low, this tradeoff seems favorable.

### What about Safari 10.1-11?

Similar to Edge, Safari has bugs with native ES6 code (relating to block-scoped variables) that requires workarounds. Safari usage skews heavily towards latest versions, so moving non-compliant browsers to the slow path is the right tradeoff.

### Why doesn't Fusion use `<script type="module">` and `<script nomodule>`?

Fusion.js has historically supported non-strict mode code, which often appears in 3rd party `node_modules`. Because module scripts are implicitly strict mode, this means any non-strict mode code would break. So even the modern bundles must be served as regular scripts.

Another blocking issue with module scripts is [Safari won't send credentials for same-origin module scripts even when using the appropriate `crossorigin` attribute](https://bugs.webkit.org/show_bug.cgi?id=171550). This means Safari will fail to load module scripts in certain circumstances, such as deployments behind authentication that don't use a CDN.
