const test = require('tape');
const transform = require('./transform');
/* eslint-env node */

test('replace import declaration when importing from "fusion-core" modules', t => {
  t.plan(1);

  const transformedCode = transform(
    `import {propOne, propTwo} from 'fusion-core'`
  );

  t.equal(
    transformedCode,
    `const propOne = SECRET_PROP_ONE_GLOBAL;
const propTwo = SECRET_PROP_TWO_GLOBAL;`
  );
  t.end();
});

test("don't replace import declaration when importing from a different module", t => {
  t.plan(1);

  const transformedCode = transform(`import {propOne, propTwo} from 'bar'`);

  t.equal(transformedCode, `import { propOne, propTwo } from 'bar';`);
  t.end();
});
