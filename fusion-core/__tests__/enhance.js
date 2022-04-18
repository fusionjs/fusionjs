/* @noflow */

import ClientAppFactory from '../src/client-app';
import ServerAppFactory from '../src/server-app';
import {createPlugin} from '../src/create-plugin';
import {createToken} from '../src/create-token';
import {run} from './test-helper';
import {RenderToken} from '../src/tokens';

const App = __BROWSER__ ? ClientAppFactory() : ServerAppFactory();

test('enhancement', (done) => {
  const app = new App('el', (el) => el);

  const FnToken = createToken('FnType');
  const BaseFn = createPlugin({
    provides: () => {
      return (arg) => arg;
    },
  });
  const BaseFnEnhancer = (fn) => {
    return (arg) => {
      return fn(arg) + ' enhanced';
    };
  };
  app.register(FnToken, BaseFn);
  app.enhance(FnToken, BaseFnEnhancer);
  app.middleware({fn: FnToken}, ({fn}) => {
    expect(fn('hello')).toBe('hello enhanced');
    done();
    return (ctx, next) => next();
  });
  app.resolve();
});

test('enhancement with a plugin', (done) => {
  const app = new App('el', (el) => el);

  const FnToken = createToken('FnType');
  const BaseFn = createPlugin({
    provides: () => {
      return (arg) => arg;
    },
  });
  const BaseFnEnhancer = (fn) => {
    return createPlugin({
      provides: () => {
        return (arg) => {
          return fn(arg) + ' enhanced';
        };
      },
    });
  };
  app.register(FnToken, BaseFn);
  app.enhance(FnToken, BaseFnEnhancer);
  app.middleware({fn: FnToken}, ({fn}) => {
    expect(fn('hello')).toBe('hello enhanced');
    done();
    return (ctx, next) => next();
  });
  app.resolve();
});

test('enhancement with a plugin allows orphan plugins', () => {
  const app = new App('el', (el) => el);

  const FnToken = createToken('FnType');
  const BaseFn = (a) => a;
  const BaseFnEnhancer = (fn) => {
    return createPlugin({
      provides: () => {
        return (arg) => {
          return fn(arg) + ' enhanced';
        };
      },
    });
  };
  app.register(FnToken, BaseFn);
  app.enhance(FnToken, BaseFnEnhancer);
  expect(() => {
    app.resolve();
  }).not.toThrow();
});

test('enhancement with a plugin with deps', (done) => {
  const app = new App('el', (el) => el);

  const DepAToken = createToken('DepA');
  const DepBToken = createToken('DepB');
  const DepCToken = createToken('DepC');

  const DepA = 'test-dep-a';
  const DepB = createPlugin({
    deps: {
      a: DepAToken,
    },
    provides: ({a}) => {
      expect(a).toBe(DepA);
      return 'test-dep-b';
    },
  });

  const FnToken = createToken('FnType');
  const BaseFn = createPlugin({
    provides: () => {
      return (arg) => arg;
    },
  });
  const BaseFnEnhancer = (fn) => {
    return createPlugin({
      deps: {
        a: DepAToken,
        b: DepBToken,
        c: DepCToken,
      },
      provides: ({a, b, c}) => {
        expect(a).toBe('test-dep-a');
        expect(b).toBe('test-dep-b');
        expect(c).toBe('test-dep-c');
        return (arg) => {
          return fn(arg) + ' enhanced';
        };
      },
    });
  };
  app.register(DepAToken, DepA);
  app.register(DepBToken, DepB);
  app.register(DepCToken, 'test-dep-c');
  app.register(FnToken, BaseFn);
  app.enhance(FnToken, BaseFnEnhancer);
  app.middleware({fn: FnToken}, ({fn}) => {
    expect(fn('hello')).toBe('hello enhanced');
    done();
    return (ctx, next) => next();
  });
  app.resolve();
});

// TODO(#573) This is a regression test which hasn't been fixed yet
test.skip('Plugin enhancer on unregistered token with no dependencies', (t) => {
  let app = new App('el', (el) => el);

  const FnToken = createToken('FnType');
  let BaseFnEnhancer = (fn) => {
    return createPlugin({
      provides: () => {
        return (arg) => {
          return fn(arg) + ' enhanced';
        };
      },
    });
  };
  app.enhance(FnToken, BaseFnEnhancer);
  expect(() => {
    app.resolve();
  }).toThrow();
});

// TODO(#573) This is a regression test which hasn't been fixed yet
test.skip('Plugin enhancer on unregistered token with optional dependency', (t) => {
  let app = new App('el', (el) => el);

  const FnToken = createToken('FnType');
  let BaseFnEnhancer = (fn) => {
    return createPlugin({
      provides: () => {
        return (arg) => {
          return fn(arg) + ' enhanced';
        };
      },
    });
  };
  app.register(
    createPlugin({
      deps: {
        fn: FnToken.optional,
      },
    })
  );
  app.enhance(FnToken, BaseFnEnhancer);
  expect(() => {
    app.resolve();
  }).toThrow();
});

// TODO(#573) This is a regression test which hasn't been fixed yet
test.skip('regular enhancer on unregistered token with no dependencies', (t) => {
  let app = new App('el', (el) => el);

  const FnToken = createToken('FnType');
  let BaseFnEnhancer = (fn) => {
    return fn;
  };
  app.enhance(FnToken, BaseFnEnhancer);
  expect(() => {
    app.resolve();
  }).toThrow();
});

test('regular enhancer on unregistered token with optional dependencies', () => {
  let app = new App('el', (el) => el);

  const FnToken = createToken('FnType');
  let BaseFnEnhancer = (fn) => {
    return fn;
  };
  app.register(
    createPlugin({
      deps: {
        fn: FnToken.optional,
      },
    })
  );
  app.enhance(FnToken, BaseFnEnhancer);
  expect(() => {
    app.resolve();
  }).toThrow();
});

test('enhancement with a plugin with missing deps', () => {
  const app = new App('el', (el) => el);

  const DepAToken = createToken('DepA');
  const DepBToken = createToken('DepB');

  const DepB = 'test-dep-b';

  const FnToken = createToken('FnType');
  const BaseFn = createPlugin({
    provides: () => {
      return (arg) => arg;
    },
  });
  const provides = jest.fn();
  const BaseFnEnhancer = (fn) => {
    return createPlugin({
      deps: {
        a: DepAToken,
        b: DepBToken,
      },
      provides,
    });
  };
  app.register(DepBToken, DepB);
  app.register(FnToken, BaseFn);
  app.enhance(FnToken, BaseFnEnhancer);
  app.middleware({fn: FnToken}, ({fn}) => {
    expect(fn('hello')).toBe('hello enhanced');
    return (ctx, next) => next();
  });
  expect(() => app.resolve()).toThrow(
    /This token is a required dependency of the plugin registered to "EnhancerOf<FnType>" token/
  );
  expect(provides).not.toHaveBeenCalled();
});

test('Enhancer middleware hoisted up to position of original registration', async () => {
  const Token = createToken('Token');
  const SomeDep = createToken('SomeDep');
  let app = new App('el', (el) => el);

  let executions = [];

  app.register(
    Token,
    createPlugin({
      deps: {dep: SomeDep},
      provides: () => {},
      middleware: () => (ctx, next) => {
        executions.push(2);
        return next();
      },
    })
  );
  // Dep middleware of original should be executed before enhanced middlewares
  app.register(
    SomeDep,
    createPlugin({
      provides: () => {},
      middleware: () => (ctx, next) => {
        executions.push(1);
        return next();
      },
    })
  );
  app.middleware((ctx, next) => {
    executions.push(4);
    return next();
  });
  // Despite being registered last, this enhancer middleware
  // should be sorted before the above middleware
  app.enhance(Token, () =>
    createPlugin({
      provides: () => {},
      middleware: () => (ctx, next) => {
        executions.push(3);
        return next();
      },
    })
  );
  await run(app);
  expect(executions).toStrictEqual([1, 2, 3, 4]);
});

test('Chained enhancer middleware hoisted up to position of original registration', async () => {
  const Token = createToken('Token');
  const SomeDep = createToken('SomeDep');
  let app = new App('el', (el) => el);

  let executions = [];

  app.middleware((ctx, next) => {
    executions.push(0);
    return next();
  });
  app.register(
    Token,
    createPlugin({
      deps: {dep: SomeDep},
      provides: () => {},
      middleware: () => (ctx, next) => {
        executions.push(2);
        return next();
      },
    })
  );
  // Dep middleware of original should be executed before enhanced middlewares
  app.register(
    SomeDep,
    createPlugin({
      provides: () => {},
      middleware: () => (ctx, next) => {
        executions.push(1);
        return next();
      },
    })
  );
  app.middleware((ctx, next) => {
    executions.push(6);
    return next();
  });
  // Despite being registered later, these middleware should be hoisted up to
  // position of original token registration
  app.enhance(Token, () =>
    createPlugin({
      provides: () => {},
      middleware: () => (ctx, next) => {
        executions.push(3);
        return next();
      },
    })
  );
  app.enhance(Token, () =>
    createPlugin({
      provides: () => {},
      middleware: () => (ctx, next) => {
        executions.push(4);
        return next();
      },
    })
  );
  app.enhance(Token, () =>
    createPlugin({
      provides: () => {},
      middleware: () => (ctx, next) => {
        executions.push(5);
        return next();
      },
    })
  );
  await run(app);
  expect(executions).toStrictEqual([0, 1, 2, 3, 4, 5, 6]);
});

test('Simple RenderToken enhancer middleware order', async () => {
  let app = new App('el', (el) => el);

  let executions = [];

  app.middleware((ctx, next) => {
    executions.push(0);
    return next();
  });
  app.enhance(RenderToken, (render) =>
    createPlugin({
      provides: () => render,
      middleware: () => (ctx, next) => {
        executions.push(2);
        return next();
      },
    })
  );
  app.middleware((ctx, next) => {
    executions.push(1);
    return next();
  });
  await run(app);
  expect(executions).toStrictEqual([0, 1, 2]);
});

test('Complex RenderToken enhancer order', async () => {
  const SomeDep = createToken('SomeDep');
  const OtherDep = createToken('OtherDep');
  const AnotherDep = createToken('AnotherDep');

  let executions = [];

  const render = createPlugin({
    deps: {other: AnotherDep},
    provides: () => (el) => {
      executions.push('render_fn');
      return el;
    },
    middleware: () => (ctx, next) => {
      executions.push('render_middleware');
      return next();
    },
  });

  let app = new App('el', render);

  app.middleware((ctx, next) => {
    executions.push('before_middleware');
    return next();
  });
  // Dep middleware of original should be executed before enhanced middlewares
  app.register(
    SomeDep,
    createPlugin({
      provides: () => {},
      middleware: () => (ctx, next) => {
        executions.push('somedep');
        return next();
      },
    })
  );
  app.middleware((ctx, next) => {
    executions.push('after_middleware');
    return next();
  });
  app.enhance(RenderToken, (render) =>
    createPlugin({
      provides: () => render,
      middleware: () => (ctx, next) => {
        executions.push('render_enhancer1');
        return next();
      },
    })
  );
  app.enhance(RenderToken, (render) =>
    createPlugin({
      deps: {other: OtherDep},
      provides: () => render,
      middleware: () => (ctx, next) => {
        executions.push('render_enhancer2');
        return next();
      },
    })
  );
  app.register(AnotherDep, 'AnotherDep');
  app.enhance(RenderToken, (render) =>
    createPlugin({
      provides: () => render,
      middleware: () => (ctx, next) => {
        executions.push('render_enhancer3');
        return next();
      },
    })
  );
  app.register(
    OtherDep,
    createPlugin({
      provides: () => {},
      middleware: () => (ctx, next) => {
        executions.push('otherdep');
        return next();
      },
    })
  );

  await run(app);
  expect(executions).toStrictEqual([
    'before_middleware',
    'somedep',
    'after_middleware',
    'otherdep',
    'render_middleware',
    'render_enhancer1',
    'render_enhancer2',
    'render_enhancer3',
    'render_fn',
  ]);
});
