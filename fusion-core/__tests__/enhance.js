/* @flow */

import ClientAppFactory from '../src/client-app';
import ServerAppFactory from '../src/server-app';
import {createPlugin} from '../src/create-plugin';
import {createToken} from '../src/create-token';
import type {FusionPlugin, Token} from '../src/types.js';

const App = __BROWSER__ ? ClientAppFactory() : ServerAppFactory();

test('enhancement', done => {
  const app = new App('el', el => el);

  type FnType = string => string;
  const FnToken: Token<FnType> = createToken('FnType');
  const BaseFn: FusionPlugin<void, FnType> = createPlugin({
    provides: () => {
      return arg => arg;
    },
  });
  const BaseFnEnhancer = (fn: FnType): FnType => {
    return arg => {
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

test('enhancement with a plugin', done => {
  const app = new App('el', el => el);

  type FnType = string => string;
  const FnToken: Token<FnType> = createToken('FnType');
  const BaseFn: FusionPlugin<void, FnType> = createPlugin({
    provides: () => {
      return arg => arg;
    },
  });
  const BaseFnEnhancer = (fn: FnType): FusionPlugin<void, FnType> => {
    return createPlugin({
      provides: () => {
        return arg => {
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
  const app = new App('el', el => el);

  type FnType = string => string;
  const FnToken: Token<FnType> = createToken('FnType');
  const BaseFn: FnType = a => a;
  const BaseFnEnhancer = (fn: FnType): FusionPlugin<void, FnType> => {
    return createPlugin({
      provides: () => {
        return arg => {
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

test('enhancement with a non-plugin enhancer does not allow orphan plugins', () => {
  const app = new App('el', el => el);

  type FnType = string => string;
  const FnToken: Token<FnType> = createToken('FnType');
  const BaseFn: FnType = a => a;
  const BaseFnEnhancer = (fn: FnType): FnType => {
    return fn;
  };
  app.register(FnToken, BaseFn);
  app.enhance(FnToken, BaseFnEnhancer);
  expect(() => {
    app.resolve();
  }).toThrow();
});

test('enhancement with a plugin with deps', done => {
  const app = new App('el', el => el);

  const DepAToken: Token<string> = createToken('DepA');
  const DepBToken: Token<string> = createToken('DepB');
  const DepCToken: Token<string> = createToken('DepC');

  const DepA = 'test-dep-a';
  const DepB: FusionPlugin<{a: Token<string>}, string> = createPlugin({
    deps: {
      a: DepAToken,
    },
    provides: ({a}) => {
      expect(a).toBe(DepA);
      return 'test-dep-b';
    },
  });

  type FnType = string => string;
  const FnToken: Token<FnType> = createToken('FnType');
  const BaseFn: FusionPlugin<void, FnType> = createPlugin({
    provides: () => {
      return arg => arg;
    },
  });
  const BaseFnEnhancer = (
    fn: FnType
  ): FusionPlugin<
    {a: Token<string>, b: Token<string>, c: Token<string>},
    FnType
  > => {
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
        return arg => {
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
test.skip('Plugin enhancer on unregistered token with no dependencies', t => {
  let app = new App('el', el => el);
  type FnType = string => string;
  const FnToken: Token<FnType> = createToken('FnType');
  let BaseFnEnhancer = (fn: FnType): FusionPlugin<void, FnType> => {
    return createPlugin({
      provides: () => {
        return arg => {
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
test.skip('Plugin enhancer on unregistered token with optional dependency', t => {
  let app = new App('el', el => el);
  type FnType = string => string;
  const FnToken: Token<FnType> = createToken('FnType');
  let BaseFnEnhancer = (fn: FnType): FusionPlugin<void, FnType> => {
    return createPlugin({
      provides: () => {
        return arg => {
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
test.skip('regular enhancer on unregistered token with no dependencies', t => {
  let app = new App('el', el => el);
  type FnType = string => string;
  const FnToken: Token<FnType> = createToken('FnType');
  let BaseFnEnhancer = (fn: FnType): FnType => {
    return fn;
  };
  app.enhance(FnToken, BaseFnEnhancer);
  expect(() => {
    app.resolve();
  }).toThrow();
});

test('regular enhancer on unregistered token with optional dependencies', () => {
  let app = new App('el', el => el);
  type FnType = string => string;
  const FnToken: Token<FnType> = createToken('FnType');
  let BaseFnEnhancer = (fn: FnType): FnType => {
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
  const app = new App('el', el => el);

  const DepAToken: Token<string> = createToken('DepA');
  const DepBToken: Token<string> = createToken('DepB');

  const DepB = 'test-dep-b';

  type FnType = string => string;
  const FnToken: Token<FnType> = createToken('FnType');
  const BaseFn: FusionPlugin<void, FnType> = createPlugin({
    provides: () => {
      return arg => arg;
    },
  });
  const provides = jest.fn();
  const BaseFnEnhancer = (
    fn: FnType
  ): FusionPlugin<{a: Token<string>, b: Token<string>}, FnType> => {
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
