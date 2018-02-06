# Framework comparison

FusionJS is a web framework developed by Uber. It's comprised of a CLI, a webpack/babel transpilation pipeline, a Koa server, and a plugin-based isomorphic runtime architecture.

In addition to these core areas, the FusionJS team provides several plugins for various things: from React and Redux to translations and CSRF protection. This makes FusionJS a one-stop shop for full stack development, while at the same time making it easy to keep bundle size small by allowing developers to only include what they need.

Here is how FusionJS compares to some popular frameworks and libraries:

### React

[React](https://reactjs.org/) is a popular and mature library developed by Facebook for implementing component-based UIs. FusionJS can be used seamlessly with React: JSX, ES2017, hot module reloading, server-side rendering, etc. all work out of the box. In addition, the FusionJS core is view-layer agnostic and we are planning on adding plugins for Preact in the future.

Through plugins, FusionJS provides various extra features on top of vanilla React: it provides an easy way to do code splitting, it supports async server-side rendering, it allows plugins to automatically install providers when needed, etc.

#### create-react-app

[create-react-app](https://github.com/facebookincubator/create-react-app) is a CLI that scaffolds a React project, as well as configure Webpack, Babel, Eslint, Jest, etc. There are some things it doesn't support out of the box (most notably, [server rendering and hot reloading of components](https://github.com/facebookincubator/create-react-app#limitations)), but it provides the ability to "eject", so you can use it as a boilerplate generator and customize the build workflow from there.

FusionJS is similar to create-react-app in the sense that it provides a Webpack/Babel setup, but in addition to that, it provides higher level tools like server-side rendering, more powerful code splitting and fully integrated hot reloading. FusionJS also provides a modern HTTP server API (through [Koa](http://koajs.com/)) and an universal code environment.

Because FusionJS provides the compilation pipeline, as well as both the server and browser environments, it has the potential to automatically apply several optimizations that would otherwise need to be done manually for every application.

### Express

[Express](https://expressjs.com/) is the most popular HTTP server framework for Node.js. While it is agnostic of rendering libraries (being compatible with libraries such as pug or handlebars), it's generally not as trivial to integrate to modern React tooling (e.g. HMR) unless you adopt a more opinionated framework on top of Express.

Both Express and FusionJS can be used as a Node.js server and both can be composed via middlewares. The major difference is that FusionJS uses Koa.js middlewares. Koa uses a more modern async/await based middleware architecture, which gives a better stack trace/debugging experience.

### Next.js

[Next.js](https://github.com/zeit/next.js/) is a framework developer by Zeit.co designed for building server-rendered React applications. It's very similar in scope to FusionJS.

The main difference is that Next.js focuses on React development and doesn't provide facilities for developing full-on backends, whereas FusionJS is a full stack framework, which supports backend development through [Koa](http://koajs.com/) middlewares and RPC plugins.

Both Next.js and FusionJS can be used with a variety of 3rd party libraries, but in the interest of avoiding analysis paralysis, the FusionJS team also provides a curated set of plugins that we consider important for production-quality applications and that can integrate into a base app in a way that is performant and boilerplate-free.

### Electrode.io

[Electrode](http://www.electrode.io/) is a framework developed by Walmart Labs designed for building server-rendered React applications. It's very similar in scope to FusionJS, and offers many of the same features (e.g. server rendering, hot reloading, etc).

Electrode has been around longer and has more mature tooling surrounding bundle analysis and deployment. FusionJS is a much younger project and we plan on focusing more on automating performance optimization strategies and solidifying features related to application health monitoring.
