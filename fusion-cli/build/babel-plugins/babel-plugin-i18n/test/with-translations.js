/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const test = require('tape');

const getExpected = require('./get-expected.js');
const transform = require('./transform.js');

test('withTranslations hoc', t => {
  t.plan(1);
  const result = transform(
    `
    import {withTranslations} from 'fusion-plugin-i18n-react';

    function Component() {
      return <div>Hello World</div>;
    }

    export default withTranslations(['foo'])(Component);
  `
  );
  const expected = getExpected(
    `var _translations = ['foo'];
import { withTranslations } from 'fusion-plugin-i18n-react';

function Component() {
  return <div>Hello World</div>;
}

export default withTranslations(['foo'])(Component);`
  );
  t.equal(result, expected);
  t.end();
});

test('withTranslations hoc with multiple translations', t => {
  t.plan(1);
  const result = transform(
    `
    import {withTranslations} from 'fusion-plugin-i18n-react';

    function Component() {
      return <div>Hello World</div>;
    }

    export default withTranslations(['foo', 'baz'])(Component);
  `
  );
  const expected = getExpected(
    `var _translations = ['foo', 'baz'];
import { withTranslations } from 'fusion-plugin-i18n-react';

function Component() {
  return <div>Hello World</div>;
}

export default withTranslations(['foo', 'baz'])(Component);`
  );
  t.equal(result, expected);
  t.end();
});

test('withTranslations hoc with invalid params', t => {
  t.plan(1);
  t.throws(() => {
    transform(
      `
      import {withTranslations} from 'fusion-plugin-i18n-react';

      function Component() {
        return <div>Hello World</div>;
      }

      export default withTranslations([window])(Component);
    `
    );
  });
});

test('withTranslations hoc with no translations', t => {
  t.plan(1);
  const result = transform(
    `
    import {withTranslations} from 'fusion-plugin-i18n-react';

    function Component() {
      return <div>foo</div>;
    }
  `
  );
  const expected = getExpected(
    `import { withTranslations } from 'fusion-plugin-i18n-react';

function Component() {
  return <div>foo</div>;
}`,
    false
  );
  t.equal(result, expected);
  t.end();
});
