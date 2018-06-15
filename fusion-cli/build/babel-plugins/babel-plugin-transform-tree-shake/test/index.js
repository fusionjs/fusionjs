// @flow
/* eslint-env node */
const fs = require('fs');
const test = require('tape');
const {transformFileSync} = require('@babel/core');
const plugin = require('../');
const {globalsPreset} = require('../../../babel-fusion-preset.js');

test('boolean expression transformed', t => {
  const output = transformFileSync(
    __dirname + '/fixtures/input-boolean-expression',
    {
      presets: [
        [
          globalsPreset,
          {
            target: 'browser',
            transformGlobals: true,
            assumeNoImportSideEffects: true,
          },
        ],
      ],
    }
  );
  const expected = fs
    .readFileSync(__dirname + '/fixtures/expected-boolean-expression', 'utf-8')
    .trim();
  t.equal(output.code, expected, 'replaced correctly');
  t.end();
});

test('conditional expression transformed', t => {
  const output = transformFileSync(
    __dirname + '/fixtures/input-conditional-expression',
    {
      plugins: [plugin],
    }
  );
  const expected = fs
    .readFileSync(
      __dirname + '/fixtures/expected-conditional-expression',
      'utf-8'
    )
    .trim();
  t.equal(output.code, expected, 'replaced correctly');
  t.end();
});

test('import with no specifiers', t => {
  const output = transformFileSync(
    __dirname + '/fixtures/input-no-specifiers',
    {
      plugins: [plugin],
    }
  );
  const expected = fs
    .readFileSync(__dirname + '/fixtures/expected-no-specifiers', 'utf-8')
    .trim();
  t.equal(output.code, expected, 'replaced correctly');
  t.end();
});

test('import react', t => {
  const output = transformFileSync(__dirname + '/fixtures/input-react', {
    plugins: [plugin],
  });
  const expected = fs
    .readFileSync(__dirname + '/fixtures/expected-react', 'utf-8')
    .trim();
  t.equal(output.code, expected, 'replaced correctly');
  t.end();
});

test('transforms ternary', t => {
  const output = transformFileSync(__dirname + '/fixtures/input-ternary', {
    plugins: [plugin],
  });
  const expected = fs
    .readFileSync(__dirname + '/fixtures/expected-ternary', 'utf-8')
    .trim();
  t.equal(output.code, expected, 'replaced correctly');
  t.end();
});

test('transforms complex', t => {
  const output = transformFileSync(__dirname + '/fixtures/input-complex', {
    plugins: [plugin],
  });
  const expected = fs
    .readFileSync(__dirname + '/fixtures/expected-complex', 'utf-8')
    .trim();
  t.equal(output.code, expected, 'replaced correctly');
  t.end();
});
