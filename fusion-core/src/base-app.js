import {createPlugin} from './create-plugin';
import {ElementToken, RenderToken} from './tokens';

class FusionApp {
  constructor(element, render) {
    this.registered = new Map();
    this.plugins = [];
    element && this.register(ElementToken, element);
    render && this.register(RenderToken, render);
  }
  register(token, value) {
    if (value === undefined) {
      value = token;
    }
    // the renderer is a special case, since it needs to be always run last
    this.plugins.push(token);
    const {aliases, enhancers} = this.registered.get(token) || {
      aliases: new Map(),
      enhancers: [],
    };
    this.registered.set(token, {value, aliases, enhancers});
    function alias(sourceToken, destToken) {
      aliases.set(sourceToken, destToken);
      return {alias};
    }
    return {alias};
  }
  middleware(deps, middleware) {
    if (middleware === undefined) {
      middleware = () => deps;
    }
    this.register(createPlugin({deps, middleware}));
  }
  enhance(token, enhancer) {
    const {value, aliases, enhancers} = this.registered.get(token) || {
      aliases: new Map(),
      enhancers: [],
    };
    enhancers.push(enhancer);
    this.registered.set(token, {value, aliases, enhancers});
  }
  resolve() {
    const resolved = new Map();
    const dependedOn = new Set();
    const nonPluginTokens = new Set();
    const resolving = new Set();
    const registered = this.registered;
    const resolvedPlugins = [];
    const allAliases = new Set();
    const resolveToken = (token, tokenAliases) => {
      // if we have already resolved the type, return it
      if (tokenAliases && tokenAliases.has(token)) {
        const newToken = tokenAliases.get(token);
        allAliases.add([token, newToken]);
        token = newToken;
      }

      if (resolved.has(token)) {
        return resolved.get(token);
      }
      // if currently resolving the same type, we have a circular dependency
      if (resolving.has(token)) {
        throw new Error(
          `Cannot resolve circular dependency: ${token.toString()}`
        );
      }
      let {value, aliases, enhancers} = registered.get(token) || {};
      // the type was never registered, throw error
      if (value === undefined) {
        // Attempt to get default value
        value = token();
        if (value === undefined) {
          throw new Error(
            `Cannot resolve to a default value of 'undefined' for token: ${token.toString()}`
          );
        }
        this.register(token, value);
      }
      // get the registered type and resolve it
      resolving.add(token);

      function resolvePlugin(plugin) {
        const registeredDeps = plugin.deps || {};
        const resolvedDeps = {};
        for (const key in registeredDeps) {
          const registeredToken = registeredDeps[key];
          dependedOn.add(registeredToken);
          resolvedDeps[key] = resolveToken(registeredToken, aliases);
        }
        // `provides` should be undefined if the plugin does not have a `provides` function
        let provides = plugin.provides
          ? plugin.provides(resolvedDeps)
          : undefined;
        if (plugin.middleware) {
          resolvedPlugins.push(plugin.middleware(resolvedDeps, provides));
        }
        return provides;
      }
      let provides = value;
      if (value && value.__plugin__) {
        provides = resolvePlugin(provides);
      } else {
        nonPluginTokens.add(token);
      }

      if (enhancers && enhancers.length) {
        enhancers.forEach(e => {
          let nextProvides = e(provides);
          if (nextProvides && nextProvides.__plugin__) {
            nextProvides = resolvePlugin(nextProvides);
          }
          provides = nextProvides;
        });
      }
      resolved.set(token, provides);
      resolving.delete(token);
      return provides;
    };

    for (let i = 0; i < this.plugins.length; i++) {
      resolveToken(this.plugins[i]);
    }
    for (const aliasPair of allAliases) {
      const [sourceToken, destToken] = aliasPair;
      if (dependedOn.has(sourceToken)) {
        dependedOn.add(destToken);
      }
    }
    for (const token of nonPluginTokens) {
      if (!dependedOn.has(token)) {
        throw new Error(
          `Registered token without depending on it: ${
            token instanceof Function ? token() : String(token)
          }`
        );
      }
    }
    this.plugins = resolvedPlugins;
  }
}

export default FusionApp;
