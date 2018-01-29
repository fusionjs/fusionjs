import test from 'tape-cup';
import Plugin, {
  SessionCookieExpiresToken,
  SessionCookieNameToken,
  SessionSecretToken,
} from '../index';

test('interface', t => {
  t.ok(Plugin, 'exports a default plugin');
  t.ok(SessionCookieExpiresToken, 'exports SessionCookieExpiresToken');
  t.ok(SessionCookieNameToken, 'exports SessionCookieNameToken');
  t.ok(SessionSecretToken, 'exports SessionSecretToken');
  t.end();
});
