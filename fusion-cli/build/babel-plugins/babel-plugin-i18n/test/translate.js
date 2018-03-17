// @flow
/* eslint-env node */
const test = require('tape');
const getExpected = require('./get-expected.js');
const transform = require('./transform.js');

test('translation component', t => {
  t.plan(1);
  const result = transform(
    `
    import {Translate} from 'fusion-plugin-i18n-react';

    function Component() {
      return <Translate id="foo"/>;
    }
  `
  );
  const expected = getExpected(
    `var _translations = ['foo'];
import { Translate } from 'fusion-plugin-i18n-react';

function Component() {
  return <Translate id='foo' />;
}\n`
  );
  t.equal(result, expected);
  t.end();
});

test('no translations', t => {
  t.plan(1);
  const result = transform(
    `
    import {Translate} from 'fusion-plugin-i18n-react';

    function Component() {
      return <div>foo</div>;
    }
  `
  );
  const expected = getExpected(
    `import { Translate } from 'fusion-plugin-i18n-react';

function Component() {
  return <div>foo</div>;
}`,
    false
  );
  t.equal(result, expected);
  t.end();
});
