// @noflow

/*
Execution algorithm overview:

We instantiate a list of incomplete generator functions. Then sequentially
execute each generator to completion.

If generator yields a blocker, we move the generator to the end of the list.
Otherwise, when the generator is done, we remove it from the pending list.
Example: generator is blocked because it depends on a yet unresolved dependency.

If an async blocker is yielded, we remove the generator from the list and move
on to the next generator. When the async blocker resolves, we put the generator
back into the list and resume execution.

If at any point we consecutively move each generator of the list without making
any progress (i.e. each generator is blocked), we know we have an unresolveable
system (probably a cyclic dependency).

Execution of all plugin code is inherently in a topological order because
we pause execution anytime blockers may occur. Therefore hooks are executed
in a valid topological order as well.
*/

import {getTokenRef} from './create-token.js';
import {declarePlugin, getPluginFn} from './create-plugin.js';
import wrapMiddleware from './utils/wrap-middleware.js';
import {unescape} from './sanitization.js';

// This is the global reference that hooks can use during synchronous execution.
// For example, a hook could push add a middleware to the app.
let global_app_ref = void 0;

const NEXT = 0,
  STOP = 1;

export class App {
  constructor() {
    this.taskMap = new Map();
    this.resolved = new Map();
    this.count = 0;
    this.unresolvedAsyncCount = 0;

    // Track so we can early error if dependency on non-registered token exists.
    this.registeredTokens = new Set();

    // The first enhancer needs access to the original token.
    // This map connects the token requested by the first enhancer to the original
    this.enhancerChainRoots = new Map(); // RootRef (A') -> OriginalRef (A)

    // When adding an enhancer, we need to build upon existing tail. This map
    // allows for lookup of the prior enhancer result so the next enhancer
    // can depend on it.
    this.enhancerChainTails = new Map(); // RawRef (A) -> TailRef (A'''')

    this.enhancerTokens = new Map();

    this.cleanups = [];

    // Element wrappers
    this.wrappers = [];
    this.renderSetup = [];

    this.universalValues = {};
  }

  registerPlugin(id, taskFn, param) {
    if (!taskFn) {
      taskFn = id;
      id = void 0;
      param = taskFn;
    }

    if (!getPluginFn(taskFn)) {
      const foundPluginFn = getPluginFn(id);
      if (foundPluginFn) {
        param = taskFn;
        taskFn = foundPluginFn;
      } else {
        throw new Error('Plugin must be first or second parameter');
      }
    }

    let task = new Task(taskFn, id, param);

    if (id) {
      this.registeredTokens.add(getTokenRef(id));
    } else {
      id = {};
    }

    this.taskMap.set(getTokenRef(id), task);

    return {
      alias: (from, to) => {
        task.tokenAliases.set(getTokenRef(from), getTokenRef(to));
      },
    };
  }

  enhance(id, enhancer) {
    // Enhancers are implemented as intermediate plugins between the original value
    // and dependents. In a sense, if enhancer to A produces A', then
    // A <-- B
    // effectively becomes
    // A <--- A' <--- B

    if (!this.enhancerChainTails.has(getTokenRef(id))) {
      // Begin an enhancer chain
      const enhanceRoot = {name: id.name, stacks: id.stacks}; // Unique instance but preserved token stacks
      this.enhancerChainRoots.set(enhanceRoot, getTokenRef(id));
      this.enhancerChainTails.set(getTokenRef(id), enhanceRoot);
      this.registeredTokens.add(enhanceRoot);
    }

    const tail = this.enhancerChainTails.get(getTokenRef(id));

    const enhancerPlugin = declarePlugin(function* enhancerPlugin() {
      const [previous] = yield withDeps([tail]);
      const enhanced = enhancer(previous);
      const pluginFn = getPluginFn(enhanced);
      if (pluginFn) {
        return yield withPlugin(pluginFn);
      } else {
        return enhanced;
      }
    });

    const newTail = {name: id.name, stacks: id.stacks};
    this.enhancerChainTails.set(getTokenRef(id), newTail);
    this.registerPlugin(newTail, enhancerPlugin);
    this.enhancerTokens.set(newTail, id);
  }

  init() {
    global_app_ref = this;
    // We are using deferred pattern to more ergonomically have granular control over when
    // synchronous execution begins and ends in order to properly mantain the
    // pointer to the current app.
    let done;
    let result = new Promise((resolve) => {
      done = resolve;
    });

    for (let [enhancer, original] of this.enhancerTokens) {
      if (!this.taskMap.has(getTokenRef(original))) {
        if (__DEV__) {
          const enhancerRegistrations = [];
          for (let stack of original.stacks) {
            if (stack.type === 'enhance') {
              enhancerRegistrations.push(
                stack.stack.split('(')[1].split(')')[0]
              );
            }
          }
          console.warn(
            `Token ${
              original.name
            } is never registered but is enhanced @ ${enhancerRegistrations.join(
              ' and @ '
            )}. Orphaned enhancers will no-op and is dead code. Note that this could occur if multiple instances of ${
              original.name
            } exist and an enhanced token instance is a different from the registered token instance.`
          );
        }
        this.taskMap.delete(enhancer);
      }
    }

    this.pending = new Set(this.taskMap.values());

    for (let task of this.pending) {
      task.generator = task.fn(task.param);
    }

    const resolve = () => {
      this.count = this.pending.size;
      tasks: for (let task of this.pending) {
        this.activeTask = task; // For legacy toposort
        if (!task.step) {
          task.step = task.generator.next();
        }

        while (!task.step.done) {
          const result = task.step.value.advance(this, task, resolve);
          if (result === NEXT) {
            continue tasks;
          }
          if (result === STOP) {
            // Stop synchronous resolution. If we cannot make progress because
            // we are waiting on an async blocker.
            return;
          }
        }

        if (task.id) {
          // Final generated value is the actual return value of plugin
          this.resolved.set(getTokenRef(task.id), task.step.value);
        }

        // Task complete. Remove from pending
        this.pending.delete(task);
        // Reset cycle count because we made progress
        this.count = this.pending.size;
      }

      if (this.pending.size === 0 && this.unresolvedAsyncCount === 0) {
        global_app_ref = void 0; // Clear out app pointer before we finally resolve
        done();
      }
    };

    resolve();

    global_app_ref = void 0; // Once we return synchronously, clear out app ref.

    return result;
  }

  _setRef() {
    global_app_ref = this;
  }

  _clearRef() {
    global_app_ref = void 0;
  }
}

export function withDeps(deps) {
  return new Deps(deps);
}
class Deps {
  constructor(deps) {
    this.deps = deps;
  }
  /**
   * If deps are yielded, we handle the following scenarios:
   * A) If every token has already been resolved, simply resume generator
   * execution with the resolved values by invoking `gen.next(values)`.
   * B) There are unresolved tokens, move this task to the end and continue
   */
  advance(app, task) {
    const deps = this.deps;

    let resolvedDeps = [];

    for (let dep of deps) {
      if (task.deps && task.deps.has(dep)) {
        resolvedDeps.push(task.deps.get(dep));
        continue;
      }

      if (task.tokenAliases && task.tokenAliases.has(getTokenRef(dep))) {
        const result = getResolvedDep(
          app,
          task.tokenAliases.get(getTokenRef(dep))
        );
        if (result.resolved) {
          task.requested.push(result.eventual);
          resolvedDeps.push(result.value);
          continue;
        }
      } else {
        const result = getResolvedDep(app, dep);
        if (result.resolved) {
          task.requested.push(result.eventual);
          resolvedDeps.push(result.value);
          continue;
        }
      }

      if (
        !app.registeredTokens.has(getTokenRef(dep)) &&
        !task.tokenAliases.has(getTokenRef(dep))
      ) {
        if (dep.type && dep.type === 1) {
          resolvedDeps.push(void 0);
          continue;
        } else {
          throw new Error(
            `Missing registration for token ${
              dep.name
            }. This is a dependency of plugin registered @ ${getRegistrationPosition(
              task.id
            )}`
          );
        }
      }

      // We have an unresolved dep. If have a cycle we should immediately throw an error.
      // However, if there are still unresolved async blockers, we should just return from this
      // synchronous execution and wait to resume execution once the async blocker resolves.
      if (--app.count === 0) {
        if (app.unresolvedAsyncCount !== 0) {
          return STOP;
        } else {
          throw new Error(reportCycleError(app.pending));
        }
      }

      // Has unresolved deps, move to end to try again later
      app.pending.delete(task);
      app.pending.add(task);
      return NEXT;
    }

    task.step = task.generator.next(resolvedDeps);
  }
}

// Intentionally not exposed from src/index.js as this requires a breaking
// change to app startup from sync to async. Will expose in the future
export function withStartup(fn) {
  return new Startup(fn);
}
class Startup {
  constructor(startup) {
    this.startup = startup;
  }
  /**
   * If startup function is yielded, we invoke the function and temporarily remove
   * the generator from the pending list.
   * When the startup function resolves, we resume its execution with the resolved
   * value and add the generator back to the pending list.
   * Note that we need to keep track of how many ongoing async functions there are
   * so we don't prematurely resolve the init function (i.e. there's no pending
   * tasks, just an async function).
   */
  advance(app, task, resolve) {
    let promise = this.startup();
    task.promise = promise;

    app.unresolvedAsyncCount++;
    app.pending.delete(task);

    promise
      .then((result) => {
        // Once we resume sync execution, reset global app pointer
        global_app_ref = app;
        task.step = task.generator.next(result);
        app.unresolvedAsyncCount--;
        app.pending.add(task);
        resolve();
      })
      .catch((err) => {
        throw err;
      });

    return NEXT;
  }
}

class Child {
  constructor({plugin, param, deps, ref}) {
    this.plugin = plugin;
    this.param = param;
    this.deps = deps;
    this.ref = ref;
    this.injected = false;
  }
  /**
   If a child plugin is yielded, we register the child under a hidden token.
   Then we consider the parent to dependend on the child via this hidden token.

   So effectively, the following:

   - TokenA: ParentPlugin
     - child = withPlugin(ChildPlugin)

   becomes:

   - HiddenTokenB: ChildPlugin
   - TokenA: ParentPlugin
     - child = withDep(HiddenTokenB)

   In the future, it may make sense to just yield the child generator function,
   which would result in a more straightforward linear execution (with less jumping around).
   However, dealing with private/encapsulated deps is possibly a bit more tricky.
   */
  advance(app, task) {
    const result = getResolvedDep(app, this.ref);
    if (result.resolved) {
      task.step = task.generator.next(result.value);
      return;
    }
    if (this.injected) {
      // If not child not yet resolved but already injected, move to next task
      app.pending.delete(task);
      app.pending.add(task);
      return NEXT;
    }

    if (task.id) {
      this.ref.name = task.id.name;
      this.ref.stacks = task.id.stacks;
    }

    const childTask = new Task(this.plugin, this.ref);

    task.child = childTask; // Used by legacy sort

    childTask.generator = childTask.fn(this.param);
    this.injected = true;

    // Clone parent deps if exist so that grandchildren can resolve deps
    // provided to their parent (and thus dep encapsulation works as expected)
    childTask.deps = task.deps ? new Map(task.deps) : new Map();

    for (let {token, val} of this.deps) {
      childTask.deps.set(token, val);
    }

    app.pending.delete(task);
    app.pending.add(childTask); // Child should be executed before parent
    app.pending.add(task);
    app.count = app.pending.size; // Reset count since we've added a task
    return NEXT;
  }
}

function createWithPlugin(deps) {
  function withPlugin(plugin, param) {
    const ref = {}; // Hidden token to bridge child and parent
    return new Child({plugin, param, deps, ref});
  }
  withPlugin.using = (token, val) => {
    return createWithPlugin([...deps, {token, val}]);
  };
  return withPlugin;
}

export const withPlugin = createWithPlugin([]);

class Task {
  constructor(taskFn, id, param) {
    this.id = id;
    this.fn = taskFn;
    this.param = param;
    this.generator = void 0;
    this.step = void 0;
    this.promise = void 0;
    this.deps = void 0;
    this.tokenAliases = new Map();
    this.requested = [];
  }
}

export function withMiddleware(middleware) {
  if (__BROWSER__) {
    return;
  }

  withUniversalMiddleware(middleware);
}

export function withUniversalMiddleware(middleware) {
  const app = global_app_ref;

  if (app.enableMiddlewareTiming) {
    const token = app.activeTask.id;
    middleware = wrapMiddleware(middleware, token);
  }

  app.plugins.push(middleware);

  if (app.activeTask.middleware) {
    throw new Error('Only one middleware per plugin is allowed.');
  }
  app.activeTask.middleware = middleware;
}

export function withCleanup(cleanup) {
  const app = global_app_ref;
  if (typeof cleanup !== 'function') {
    return;
  }
  app.cleanups.push(cleanup);
}

let hydrated; // Memoize client-side hydration

export function withUniversalValue(id) {
  const app = global_app_ref;

  function serialize(val) {
    if (__NODE__) {
      // Once withRequest is implemented, check for request scope
      // and then serialize into request scope. Otherwise, this value
      // is intended to be serialized for all requests.

      if (app.SSREffectCtx) {
        const ctx = app.SSREffectCtx;
        ctx.universalValues[id] = val;
      } else if (app.renderSetupCtx) {
        const ctx = app.renderSetupCtx;
        ctx.universalValues[id] = val;
      } else if (!app.done) {
        // Universal value for all requests
        app.universalValues[id] = val;
      } else {
        throw new Error(
          'Serialize can only be called synchronously from a plugin or within `withRenderSetup` or `withSSREffect` lifecycles'
        );
      }
    } else {
      throw new Error('Cannot serialize on the browser');
    }
  }

  function hydrate() {
    if (__BROWSER__) {
      if (!hydrated) {
        try {
          const element = document.getElementById(
            '__FUSION_UNIVERSAL_VALUES__'
          );
          hydrated = JSON.parse(unescape(element.textContent));
        } catch (err) {
          console.error(`Failed to hydrate universal value: ${id}`);
          hydrated = {};
        }
      }
      return hydrated[id];
    } else {
      throw new Error('Cannot hydrate on the server');
    }
  }

  return [serialize, hydrate];
}

export function withEndpoint(endpointPath, fn) {
  if (__BROWSER__) {
    return;
  }
  const app = global_app_ref;

  // Ensure no collision with another endpoint
  for (let [existingEndpoint] of app.endpoints) {
    if (endpointPath === existingEndpoint) {
      throw new Error(
        `Cannot create endpoint with path: "${endpointPath}" as it collides with an existing endpoint.`
      );
    }
  }

  app.endpoints.set(endpointPath, fn);
}

export function withRenderSetup(fn) {
  const app = global_app_ref;
  // Element wrappers should be added in *reverse* topological order so that
  // the resulting element tree is in topological order during renders.
  // For example, if plugin B depends on plugin A, the tree should be:
  // <AProvider>
  //   <BProvider>{root}</BProvider>
  // </APRovider>
  // In this case, B provider can depend on the context of A provider.
  app.renderSetup.push(fn);
}

export function withSSREffect(effectFn) {
  if (__BROWSER__) {
    // Static transform should eliminate withSSREffect() calls from the client build
    return;
  }
  const app = global_app_ref;
  if (app.renderSetupCtx) {
    const ctx = app.renderSetupCtx;
    ctx.postRenderEffects.push(effectFn);
  } else {
    // Might also make sense to allow as a top-level lifeycle hook
    throw new Error(
      'withSSREffect can only be called during `withRenderSetup`'
    );
  }
}

export function getResolvedDep(app, id) {
  id = getTokenRef(id);

  // If looking up an enhanced token, use the lattermost enhanced result instead
  let idToCheck = app.enhancerChainTails.has(id)
    ? app.enhancerChainTails.get(id)
    : id;

  // The first enhancer needs access to the original un-enhanced token
  if (app.enhancerChainRoots.has(id)) {
    idToCheck = app.enhancerChainRoots.get(id);
  }

  if (app.resolved.has(idToCheck)) {
    return {
      resolved: true,
      value: app.resolved.get(idToCheck),
      eventual: idToCheck,
    };
  }
  return {resolved: false, eventual: idToCheck};
}

// Error: Plugin dependency graph must not have cycles.
// ┌─▶ Registration @ /foo/bar/baz.js:10:42 ──╮
// │╭─── depends on token TokenA provided by ⇠╯
// │╰▶ Registration @ /foo/bar/baz.js:11:42 ──╮
// │╭─── depends on token TokenB provided by ─╯
// │╰▶ Registration @ /foo/bar/baz.js:12:42 ──╮
// │╭─── depends on token TokenC provided by ─╯
// │╰▶ Registration /foo/bar/baz.js:13:42 ────╮
// ╰──── depends on token TokenD provided by ─╯
function reportCycleError(unresolvedTasks) {
  const cycles = [];
  const visited = new Set();

  let cycle = [];

  function walkDeps(task) {
    if (visited.has(task)) {
      return;
    }
    visited.add(task);
    if (task.step.value instanceof Deps) {
      for (let dep of task.step.value.deps) {
        cycle.push({
          name: dep.name,
          registrationPos: getRegistrationPosition(task.id),
        });
        const found = Array.from(unresolvedTasks).find((t) => t.id === dep);
        if (found) {
          walkDeps(found);
        }
      }
    }
  }

  for (let task of unresolvedTasks) {
    let len = cycle.length;
    walkDeps(task);
    if (cycle.length !== len) {
      cycles.push(cycle);
    }
    cycle = [];
  }

  let output = 'Error: Plugin dependency graph must not have cycles.\n';
  for (let cycle of cycles) {
    cycle.forEach((item, i) => {
      const registrationPos = item.registrationPos;
      const tokenName = item.name;

      // Difference in length of base strings is 15, calculate padding
      const diff = registrationPos.length - tokenName.length;
      let p1 = '';
      let p2 = '';
      if (diff > 15) {
        p2 = '─'.repeat(diff - 15);
      } else {
        p1 = '─'.repeat(Math.abs(diff - 15));
      }

      if (i === 0) {
        output += `┌─▶ Registration @ ${registrationPos} ${p1}──╮\n`;
      } else {
        output += `│╰▶ Registration @ ${registrationPos} ${p1}──╮\n`;
      }
      if (i === cycle.length - 1) {
        output += `╰──── depends on token ${tokenName} provided by ◀${p2}╯\n`;
      } else {
        output += `│╭─── depends on token ${tokenName} provided by ◀${p2}╯\n`;
      }
    });
  }

  return output;
}

function getRegistrationPosition(token) {
  if (token.stacks) {
    for (let stack of token.stacks) {
      if (stack.type === 'register') {
        return stack.stack.split('(')[1].split(')')[0];
      }
    }
  }
  return 'unknown';
}
