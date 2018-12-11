// @flow
/* eslint-env node */
const fs = require('fs');
const t = require('assert');
const {transformFileSync} = require('@babel/core');
const plugin = require('../');

test('boolean expression transformed', () => {
  const output = transformFileSync(
    __dirname + '/fixtures/input-boolean-expression',
    {
      plugins: [
        [require('babel-plugin-transform-cup-globals'), {target: 'browser'}],
        [plugin, {target: 'browser'}],
      ],
    }
  );
  const expected = fs
    .readFileSync(__dirname + '/fixtures/expected-boolean-expression', 'utf-8')
    .trim();
  t.equal(output.code, expected, 'replaced correctly');
});

test('conditional expression transformed', () => {
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
});

test('import with no specifiers', () => {
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
});

test('import react', () => {
  const output = transformFileSync(__dirname + '/fixtures/input-react', {
    plugins: [plugin],
  });
  const expected = fs
    .readFileSync(__dirname + '/fixtures/expected-react', 'utf-8')
    .trim();
  t.equal(output.code, expected, 'replaced correctly');
});

test('transforms ternary', () => {
  const output = transformFileSync(__dirname + '/fixtures/input-ternary', {
    plugins: [plugin],
  });
  const expected = fs
    .readFileSync(__dirname + '/fixtures/expected-ternary', 'utf-8')
    .trim();
  t.equal(output.code, expected, 'replaced correctly');
});

test('transforms complex', () => {
  const output = transformFileSync(__dirname + '/fixtures/input-complex', {
    plugins: [plugin],
  });
  const expected = fs
    .readFileSync(__dirname + '/fixtures/expected-complex', 'utf-8')
    .trim();
  t.equal(output.code, expected, 'replaced correctly');
});
