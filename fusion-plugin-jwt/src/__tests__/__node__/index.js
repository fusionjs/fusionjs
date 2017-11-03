import tape from 'tape-cup';
import plugin from '../../jwt-server';
import {promisify} from 'util';
import jwt from 'jsonwebtoken';
const sign = promisify(jwt.sign.bind(jwt));

tape('Server plugin required config', t => {
  t.throws(plugin, 'server plugin should require config');
  t.doesNotThrow(
    () => plugin({secret: 'abcd'}),
    'server plugin should have default cookieName config'
  );
  t.throws(
    () => plugin({cookieName: 'abcd'}),
    'server plugin should require secret config'
  );
  t.doesNotThrow(
    () => plugin({cookieName: 'abcd', secret: 'abcd'}),
    'server plugin should require secret config'
  );
  t.end();
});

tape('Server plugin with no initial cookie', async t => {
  const JWT = plugin({
    secret: 'abcd',
    cookieName: 'cookie-name',
  });
  const token = null;
  const ctx = {
    cookies: {
      get: cookieName => {
        t.equal(cookieName, 'cookie-name', 'gets correct cookie name');
        return token;
      },
      set: (cookieName, value) => {
        t.equal(cookieName, 'cookie-name', 'sets correct cookie name');
        t.equal(typeof value, 'string', 'sets string value');
      },
    },
  };

  try {
    await JWT.middleware(ctx, () => {
      const j = JWT.of(ctx);
      j.token.hello = 'world';
      return Promise.resolve();
    });
  } catch (e) {
    t.ifError(e, 'does not error running middleware');
  }
  const instance = JWT.of(ctx);
  t.ok(instance, 'creates instance');
  t.equal(instance.token.hello, 'world', 'creates token');
  t.equal(instance.cookie, null, 'sets cookie');
  t.end();
});

tape('Server plugin with initial token', async t => {
  const config = {
    secret: 'abcd',
    cookieName: 'cookie-name',
  };
  const JWT = plugin(config);
  const token = await sign({hello: 'world'}, config.secret);
  const ctx = {
    cookies: {
      get: cookieName => {
        t.equal(cookieName, 'cookie-name', 'gets correct cookie name');
        return token;
      },
      set: (cookieName, value) => {
        t.equal(cookieName, 'cookie-name', 'sets correct cookie name');
        t.equal(typeof value, 'string', 'sets string value');
      },
    },
  };
  try {
    await JWT.middleware(ctx, () => {
      return Promise.resolve();
    });
  } catch (e) {
    t.ifError(e, 'does not error running middleware');
  }
  const instance = JWT.of(ctx);
  t.ok(instance, 'creates instance');
  t.equal(instance.token.hello, 'world', 'creates token');
  t.equal(instance.cookie, token, 'sets cookie');
  t.end();
});

tape('Server plugin with initial token and modifications', async t => {
  const config = {
    secret: 'abcd',
    cookieName: 'cookie-name',
  };
  const JWT = plugin(config);
  const token = await sign({hello: 'world'}, config.secret);
  const ctx = {
    cookies: {
      get: cookieName => {
        t.equal(cookieName, 'cookie-name', 'gets correct cookie name');
        return token;
      },
      set: (cookieName, value) => {
        t.equal(cookieName, 'cookie-name', 'sets correct cookie name');
        t.equal(typeof value, 'string', 'sets string value');
      },
    },
  };

  const instance = JWT.of(ctx);
  try {
    await JWT.middleware(ctx, () => {
      instance.token.lol = 'lol';
      instance.token.hello = 'lol';
      return Promise.resolve();
    });
  } catch (e) {
    t.ifError(e, 'does not error running middleware');
  }
  t.ok(instance, 'creates instance');
  t.equal(instance.token.lol, 'lol', 'updates token correctly');
  t.equal(instance.token.hello, 'lol', 'updates token correctly');
  t.equal(instance.cookie, token, 'sets cookie');
  t.end();
});
