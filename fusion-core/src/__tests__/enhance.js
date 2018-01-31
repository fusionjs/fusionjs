/* @flow */

import tape from 'tape-cup';
import ClientAppFactory from '../client-app';
import ServerAppFactory from '../server-app';
import {createPlugin} from '../create-plugin';
const App = __BROWSER__ ? ClientAppFactory() : ServerAppFactory();

function createToken(name): any {
  return () => {
    throw new Error(`Missing dependency: ${name}`);
  };
}
tape('enhancement', t => {
  const app = new App('el', el => el);

  type FnType = string => string;
  const FnToken: FnType = createToken('FnType');
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
    t.equal(fn('hello'), 'hello enhanced');
    t.end();
    return (ctx, next) => next();
  });
  app.resolve();
});

tape('enhancement with a plugin', t => {
  const app = new App('el', el => el);

  type FnType = string => string;
  const FnToken: FnType = createToken('FnType');
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
    t.equal(fn('hello'), 'hello enhanced');
    t.end();
    return (ctx, next) => next();
  });
  app.resolve();
});

tape('enhancement with a plugin with deps', t => {
  const app = new App('el', el => el);

  const DepAToken: string = createToken('DepA');
  const DepBToken: string = createToken('DepB');

  const DepA = 'test-dep-a';
  const DepB: FusionPlugin<{a: string}, string> = createPlugin({
    deps: {
      a: DepAToken,
    },
    provides: ({a}) => {
      t.equal(a, DepA);
      return 'test-dep-b';
    },
  });

  type FnType = string => string;
  const FnToken: FnType = createToken('FnType');
  const BaseFn: FusionPlugin<void, FnType> = createPlugin({
    provides: () => {
      return arg => arg;
    },
  });
  const BaseFnEnhancer = (
    fn: FnType
  ): FusionPlugin<{a: string, b: string}, FnType> => {
    return createPlugin({
      deps: {
        a: DepAToken,
        b: DepBToken,
      },
      provides: ({a, b}) => {
        t.equal(a, 'test-dep-a');
        t.equal(b, 'test-dep-b');
        return arg => {
          return fn(arg) + ' enhanced';
        };
      },
    });
  };
  app.register(DepAToken, DepA);
  app.register(DepBToken, DepB);
  app.register(FnToken, BaseFn);
  app.enhance(FnToken, BaseFnEnhancer);
  app.middleware({fn: FnToken}, ({fn}) => {
    t.equal(fn('hello'), 'hello enhanced');
    t.end();
    return (ctx, next) => next();
  });
  app.resolve();
});

tape('enhancement with a plugin with missing deps', t => {
  const app = new App('el', el => el);

  const DepAToken: string = createToken('DepA');
  const DepBToken: string = createToken('DepB');

  const DepB = 'test-dep-b';

  type FnType = string => string;
  const FnToken: FnType = createToken('FnType');
  const BaseFn: FusionPlugin<void, FnType> = createPlugin({
    provides: () => {
      return arg => arg;
    },
  });
  const BaseFnEnhancer = (
    fn: FnType
  ): FusionPlugin<{a: string, b: string}, FnType> => {
    return createPlugin({
      deps: {
        a: DepAToken,
        b: DepBToken,
      },
      provides: () => {
        t.fail('should not get here');
        return arg => {
          return fn(arg) + ' enhanced';
        };
      },
    });
  };
  app.register(DepBToken, DepB);
  app.register(FnToken, BaseFn);
  app.enhance(FnToken, BaseFnEnhancer);
  app.middleware({fn: FnToken}, ({fn}) => {
    t.equal(fn('hello'), 'hello enhanced');
    t.end();
    return (ctx, next) => next();
  });
  t.throws(() => app.resolve(), /Missing dependency: DepA/);
  t.end();
});
