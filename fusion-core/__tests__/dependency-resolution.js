/* @noflow */
import ClientAppFactory from '../src/client-app';
import ServerAppFactory from '../src/server-app';
import {createPlugin} from '../src/create-plugin';
import {createToken} from '../src/create-token';

const App = __BROWSER__ ? ClientAppFactory() : ServerAppFactory();

const TokenA = createToken('TokenA');
const TokenB = createToken('TokenB');
const TokenC = createToken('TokenC');
const TokenD = createToken('TokenD');
const TokenEAsNullable = createToken('TokenEAsNullable');
const TokenString = createToken('TokenString');
const TokenNumber = createToken('TokenNumber');

test('dependency registration', () => {
  const app = new App('el', (el) => el);
  expect(app).toBeTruthy();
  const counters = {
    a: 0,
    b: 0,
    c: 0,
    d: 0,
  };

  const PluginA = createPlugin({
    provides: () => {
      counters.a++;
      expect(counters.a).toBe(1);
      return {
        a: 'PluginA',
      };
    },
  });
  const PluginB = createPlugin({
    deps: {
      a: TokenA,
    },
    provides: (deps) => {
      counters.b++;
      expect(deps.a.a).toBe('PluginA');
      expect(counters.b).toBe(1);
      return {
        b: 'PluginB',
      };
    },
  });

  const PluginC = createPlugin({
    deps: {
      a: TokenA,
      b: TokenB,
    },
    provides: (deps) => {
      counters.c++;
      expect(deps.a.a).toBe('PluginA');
      expect(deps.b.b).toBe('PluginB');
      expect(counters.c).toBe(1);
      return {
        c: 'PluginC',
      };
    },
  });

  app.register(TokenA, PluginA);
  app.register(TokenB, PluginB);
  app.register(TokenC, PluginC);
  app.register(
    createPlugin({
      deps: {a: TokenA, b: TokenB, c: TokenC},
      provides: (deps) => {
        counters.d++;
        expect(deps.a.a).toBe('PluginA');
        expect(deps.b.b).toBe('PluginB');
        expect(deps.c.c).toBe('PluginC');
      },
    })
  );
  expect(counters.a).toBe(0);
  expect(counters.b).toBe(0);
  expect(counters.c).toBe(0);
  expect(counters.d).toBe(0);
  app.resolve();
  expect(counters.a).toBe(1);
  expect(counters.b).toBe(1);
  expect(counters.c).toBe(1);
  expect(counters.d).toBe(1);
});

test('dependency registration with aliases', () => {
  const app = new App('el', (el) => el);
  expect(app).toBeTruthy();
  const counters = {
    a: 0,
    b: 0,
    c: 0,
    d: 0,
  };

  const PluginA = createPlugin({
    provides: () => {
      counters.a++;
      expect(counters.a).toBe(1);
      return {
        a: 'PluginA',
      };
    },
  });
  const PluginB = createPlugin({
    deps: {
      a: TokenA,
    },
    provides: (deps) => {
      counters.b++;
      expect(deps.a.a).toBe('PluginA');
      expect(counters.b).toBe(1);
      return {
        b: 'PluginB',
      };
    },
  });

  const PluginC = createPlugin({
    deps: {
      a: TokenA,
      b: TokenB,
    },
    provides: (deps) => {
      counters.c++;
      expect(deps.a.a).toBe('PluginA');
      expect(deps.b.b).toBe('PluginD');
      expect(counters.c).toBe(1);
      return {
        c: 'PluginC',
      };
    },
  });

  const PluginD = createPlugin({
    deps: {
      a: TokenA,
    },
    provides: (deps) => {
      counters.d++;
      expect(deps.a.a).toBe('PluginA');
      expect(counters.d).toBe(1);
      return {
        b: 'PluginD',
      };
    },
  });

  app.register(TokenA, PluginA);
  app.register(TokenB, PluginB);
  app.register(TokenC, PluginC).alias(TokenB, TokenD);
  app.register(TokenD, PluginD);
  expect(counters.a).toBe(0);
  expect(counters.b).toBe(0);
  expect(counters.c).toBe(0);
  expect(counters.d).toBe(0);
  app.resolve();
  expect(counters.a).toBe(1);
  expect(counters.b).toBe(1);
  expect(counters.c).toBe(1);
  expect(counters.d).toBe(1);
});

test('optional dependency registration with aliases', () => {
  const app = new App('el', (el) => el);
  expect(app).toBeTruthy();
  const counters = {
    a: 0,
    b: 0,
    c: 0,
    d: 0,
  };

  const PluginA = createPlugin({
    provides: () => {
      counters.a++;
      expect(counters.a).toBe(1);
      return {
        a: 'PluginA',
      };
    },
  });
  const PluginB = createPlugin({
    deps: {
      a: TokenA,
    },
    provides: (deps) => {
      counters.b++;
      expect(deps.a.a).toBe('PluginA');
      expect(counters.b).toBe(1);
      return {
        b: 'PluginB',
      };
    },
  });

  const PluginC = createPlugin({
    deps: {
      a: TokenA,
      b: TokenB.optional,
    },
    provides: (deps) => {
      counters.c++;
      expect(deps.a.a).toBe('PluginA');
      expect(deps.b && deps.b.b).toBe('PluginD');
      expect(counters.c).toBe(1);
      return {
        c: 'PluginC',
      };
    },
  });

  const PluginD = createPlugin({
    deps: {
      a: TokenA,
    },
    provides: (deps) => {
      counters.d++;
      expect(deps.a.a).toBe('PluginA');
      expect(counters.d).toBe(1);
      return {
        b: 'PluginD',
      };
    },
  });

  app.register(TokenA, PluginA);
  app.register(TokenB, PluginB);
  app.register(TokenC, PluginC).alias(TokenB, TokenD);
  app.register(TokenD, PluginD);
  expect(counters.a).toBe(0);
  expect(counters.b).toBe(0);
  expect(counters.c).toBe(0);
  expect(counters.d).toBe(0);
  app.resolve();
  expect(counters.a).toBe(1);
  expect(counters.b).toBe(1);
  expect(counters.c).toBe(1);
  expect(counters.d).toBe(1);
});

test('dependency registration with aliasing non-plugins', () => {
  const app = new App('el', (el) => el);
  expect(app).toBeTruthy();
  const counters = {
    a: 0,
    b: 0,
    c: 0,
    d: 0,
  };

  const ValueA = 'some-value';
  const AliasedValue = 'some-aliased-value';
  const ValueTokenA = createToken('ValueA');
  const AliasedTokenA = createToken('AliasedTokenA');
  const PluginB = createPlugin({
    deps: {
      a: ValueTokenA,
    },
    provides: (deps) => {
      counters.b++;
      expect(deps.a).toBe('some-value');
      expect(counters.b).toBe(1);
      return {
        b: 'PluginB',
      };
    },
  });

  const PluginC = createPlugin({
    deps: {
      a: ValueTokenA,
    },
    provides: (deps) => {
      counters.c++;
      expect(deps.a).toBe('some-aliased-value');
      expect(counters.c).toBe(1);
      return {
        c: 'PluginC',
      };
    },
  });

  app.register(ValueTokenA, ValueA);
  app.register(TokenB, PluginB);
  app.register(TokenC, PluginC).alias(ValueTokenA, AliasedTokenA);
  app.register(AliasedTokenA, AliasedValue);
  expect(counters.b).toBe(0);
  expect(counters.c).toBe(0);
  app.resolve();
  expect(counters.b).toBe(1);
  expect(counters.c).toBe(1);
});

test('dependency registration with no token', () => {
  const app = new App('el', (el) => el);
  const PluginA = createPlugin({
    provides: () => {
      return {
        a: 'PluginA',
      };
    },
  });
  const PluginB = createPlugin({
    deps: {
      a: TokenA,
    },
    provides: (deps) => {
      expect(deps.a.a).toBe('PluginA');
      return {
        b: 'PluginB',
      };
    },
  });

  app.register(TokenA, PluginA);
  app.register(TokenB, PluginB);
  app.register(
    createPlugin({
      deps: {a: TokenA, b: TokenB},
      provides: (deps) => {
        expect(deps.a.a).toBe('PluginA');
        expect(deps.b.b).toBe('PluginB');
      },
    })
  );
  app.resolve();
});

test('dependency registration with middleware', () => {
  const counters = {
    a: 0,
    b: 0,
    c: 0,
    d: 0,
  };
  const app = new App('el', (el) => el);
  expect(app).toBeTruthy();
  const PluginA = createPlugin({
    provides: () => {
      counters.a++;
      expect(counters.a).toBe(1);
      return {
        a: 'PluginA',
      };
    },
  });
  const PluginB = createPlugin({
    deps: {a: TokenA},
    provides: (deps) => {
      counters.b++;
      expect(deps.a.a).toBe('PluginA');
      expect(counters.b).toBe(1);
      return {
        b: 'PluginB',
      };
    },
  });
  const PluginC = createPlugin({
    deps: {a: TokenA, b: TokenB},
    provides: (deps) => {
      counters.c++;
      expect(deps.a.a).toBe('PluginA');
      expect(deps.b.b).toBe('PluginB');
      expect(counters.c).toBe(1);
      return {
        c: 'PluginC',
      };
    },
    middleware: () => (ctx, next) => next(),
  });
  app.register(TokenA, PluginA);
  app.register(TokenB, PluginB);
  app.register(TokenC, PluginC);
  expect(counters.a).toBe(0);
  expect(counters.b).toBe(0);
  expect(counters.c).toBe(0);
  app.resolve();
  expect(counters.a).toBe(1);
  expect(counters.b).toBe(1);
  expect(counters.c).toBe(1);
});

test('dependency registration with missing dependency', () => {
  const app = new App('el', (el) => el);
  const PluginA = createPlugin({
    provides: () => {
      return {
        a: 'PluginA',
      };
    },
  });
  const PluginC = createPlugin({
    deps: {a: TokenA, b: TokenB},
    provides: () => {
      return {
        c: 'PluginC',
      };
    },
  });
  app.register(TokenA, PluginA);
  app.register(TokenC, PluginC);
  expect(() => app.resolve()).toThrow();
});

test('dependency registration with missing dependency and multiple dependent plugins', () => {
  const app = new App('el', (el) => el);
  const PluginA = createPlugin({
    provides: () => {
      return {
        a: 'PluginA',
      };
    },
  });
  const OtherPlugin = createPlugin({
    deps: {
      b: TokenB.optional,
    },
  });
  const PluginC = createPlugin({
    deps: {a: TokenA, b: TokenB},
    provides: () => {
      return {
        c: 'PluginC',
      };
    },
  });
  app.register(OtherPlugin);
  app.register(TokenA, PluginA);
  app.register(TokenC, PluginC);
  expect(() => app.resolve()).toThrow();
});

test('dependency registration with null value', () => {
  const app = new App('el', (el) => el);

  expect(() => {
    const PluginC = createPlugin({
      deps: {optionalNull: TokenEAsNullable},
      provides: (deps) => {
        expect(deps.optionalNull).toBe(null);
      },
    });
    app.register(TokenEAsNullable, null);
    app.register(PluginC);
    app.resolve();
  }).not.toThrow();

  expect(() => {
    const app = new App('el', (el) => el);
    app.register(TokenString, null);
    app.middleware({something: TokenString}, ({something}) => {
      expect(something).toBe(null);
      return (ctx, next) => next();
    });
    app.resolve();
  }).not.toThrow();
});

test('dependency registration with optional deps', () => {
  const app = new App('el', (el) => el);

  const checkString = (s) => {
    expect(s).toBe('hello');
  };
  const checkNumUndefined = (n) => {
    expect(n).toBe(undefined);
  };

  const PluginA = createPlugin({
    deps: {
      str: TokenString,
      numOpt: TokenNumber.optional,
    },
    provides: ({str, numOpt}) => {
      checkString(str);
      checkNumUndefined(numOpt);

      return {
        a: 'Hello',
      };
    },
  });
  app.register(TokenString, 'hello');
  app.register(PluginA);
  app.resolve();
});

test('dependency registration with missing deep tree dependency', () => {
  const app = new App('el', (el) => el);
  const PluginA = createPlugin({
    provides: () => {
      return {
        a: 'PluginA',
      };
    },
  });
  const PluginB = createPlugin({
    deps: {a: TokenA, d: createToken('RANDOM-TOKEN')},
    provides: () => {
      return {
        b: 'PluginB',
      };
    },
  });
  const PluginC = createPlugin({
    deps: {a: TokenA, b: TokenB},
    provides: () => {
      return {
        c: 'PluginC',
      };
    },
  });
  app.register(TokenC, PluginC);
  app.register(TokenA, PluginA);
  app.register(TokenB, PluginB);
  expect(() => app.resolve()).toThrow();
});

test('dependency registration with circular dependency', () => {
  const app = new App('el', (el) => el);
  const PluginB = createPlugin({
    deps: {c: TokenC},
    provides: () => {
      return {
        b: 'PluginB',
      };
    },
  });
  const PluginC = createPlugin({
    deps: {b: TokenB},
    provides: () => {
      return {
        c: 'PluginC',
      };
    },
  });
  app.register(TokenB, PluginB);
  app.register(TokenC, PluginC);
  expect(() => app.resolve()).toThrow();
});

test('dependency configuration with missing deps', () => {
  const ParentToken = createToken('parent-token');
  const StringToken = createToken('string-token');
  const OtherStringToken = createToken('other-string-token');

  const app = new App('el', (el) => el);

  const provides = jest.fn();

  app.register(
    ParentToken,
    createPlugin({
      deps: {
        a: StringToken,
        b: OtherStringToken,
      },
      provides,
    })
  );
  app.register(StringToken, 'string-a');
  expect(() => app.resolve()).toThrow();
  expect(() => app.resolve()).toThrow(
    /This token is a required dependency of the plugin registered to "parent-token" token/
  );
  expect(provides).not.toHaveBeenCalled();
});

test('error message when dependent plugin does not have token', () => {
  const StringToken = createToken('string-token');
  const OtherStringToken = createToken('other-string-token');

  const app = new App('el', (el) => el);

  const provides = jest.fn();

  app.register(
    createPlugin({
      deps: {
        a: StringToken,
        b: OtherStringToken,
      },
      provides,
    })
  );
  app.register(StringToken, 'string-a');
  expect(() => app.resolve()).toThrow(
    /This token is a required dependency of the plugin registered to "UnnamedPlugin" token/
  );
  expect(provides).not.toHaveBeenCalled();
});

test('Missing token errors reasonably', () => {
  const app = new App('el', (el) => el);
  expect(() => app.register('some-value')).toThrow(
    /Cannot register some-value/
  );
  const BrowserPlugin = null; // idiomatic browser plugin implementation for server-only plugin is `export default null`;
  expect(() => app.register(BrowserPlugin)).toThrow(/Cannot register null/);
});

test('retrieve dependency', () => {
  const app = new App('el', (el) => el);
  const TokenA = createToken('a');
  const PluginA = createPlugin({
    provides: () => {
      return {
        a: 'Hello',
      };
    },
  });

  app.register(TokenA, PluginA);
  app.resolve();
  expect(app.getService(TokenA).a).toBe('Hello');
});

test('retrieve unresolved dependency', () => {
  const app = new App('el', (el) => el);
  const TokenA = createToken('a');
  const PluginA = createPlugin({
    provides: () => {
      return {
        a: 'Hello',
      };
    },
  });

  app.register(TokenA, PluginA);
  expect(() => app.getService(TokenA)).toThrow(
    /Cannot get service from unresolved app/
  );
});
