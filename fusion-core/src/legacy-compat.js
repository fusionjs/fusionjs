// @noflow
import {withDeps, withUniversalMiddleware, withCleanup} from './core.js';
import {declarePlugin} from './create-plugin.js';

import {getTokenRef} from './create-token.js';

export function createPlugin(opts) {
  function* LegacyPlugin() {
    let resolvedDeps = {};
    const depKeys = opts.deps ? Object.keys(opts.deps) : [];
    if (depKeys.length) {
      const deps = yield withDeps(depKeys.map((key) => opts.deps[key]));
      deps.forEach((dep, i) => {
        resolvedDeps[depKeys[i]] = dep;
      });
    }
    let providedValue;
    if (opts.provides) {
      providedValue = opts.provides(resolvedDeps);
    }
    if (opts.middleware) {
      let legacyMiddleware = opts.middleware(resolvedDeps, providedValue);
      withUniversalMiddleware(legacyMiddleware);
    }
    if (opts.cleanup && typeof opts.cleanup === 'function') {
      withCleanup(() => {
        opts.cleanup(providedValue);
      });
    }
    return providedValue;
  }

  return declarePlugin(LegacyPlugin);
}

// The core implementation yields a topological order of middleware, however
// it differs from the old implementation. In order to maintain compatibility
// with existing apps, we should sort this in the same way
export function sortLegacy(app) {
  let legacySorted = [];

  const seen = new Set();
  function visit(task) {
    if (seen.has(task)) {
      return;
    }
    seen.add(task);
    let requested = new Set(task.requested);
    for (let t of app.taskMap.values()) {
      if (requested.has(getTokenRef(t.id))) {
        visit(t);
      }
    }
    if (task.child) {
      visit(task.child);
    }

    if (task.middleware) {
      legacySorted.push(task.middleware);
    }

    if (app.enhancerChainTails.has(getTokenRef(task.id))) {
      visit(app.taskMap.get(app.enhancerChainTails.get(getTokenRef(task.id))));
    }
  }

  for (let task of app.taskMap.values()) {
    if (!app.enhancerTokens.has(task.id)) {
      visit(task);
    }
  }

  app.plugins = legacySorted;
}
