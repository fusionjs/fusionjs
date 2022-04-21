/* @flow */
/* eslint-env node */

const fs = require('fs');
const {transformFileSync, transformSync} = require('@babel/core');

const plugin = require('../');

function getOutput(file) {
  return (
    transformFileSync(__dirname + file, {
      plugins: [plugin],
    }).code + '\n'
  );
}

function transform(code) {
  return transformSync(code, {
    plugins: [plugin],
    highlightCode: false,
  });
}

function readExpected(file) {
  return fs.readFileSync(__dirname + file).toString();
}

test('Arrow function plugins', () => {
  const output = getOutput('/fixtures/arrow');
  const expected = readExpected('/fixtures/arrow-expected');
  expect(output).toBe(expected);
});

test('Collision injected imported identifier', () => {
  const output = getOutput('/fixtures/collision');
  const expected = readExpected('/fixtures/collision-expected');
  expect(output).toBe(expected);
});

test('Environment-specific hooks', () => {
  const output = getOutput('/fixtures/environment');
  const expected = readExpected('/fixtures/environment-expected');
  expect(output).toBe(expected);
});

test('Multiple hooks', () => {
  const output = getOutput('/fixtures/multiple-hooks');
  const expected = readExpected('/fixtures/multiple-hooks-expected');
  expect(output).toBe(expected);
});

test('Nested plugins', () => {
  const output = getOutput('/fixtures/nested');
  const expected = readExpected('/fixtures/nested-expected');
  expect(output).toBe(expected);
});

test('Raw generators', () => {
  const output = getOutput('/fixtures/raw');
  const expected = readExpected('/fixtures/raw-expected');
  expect(output).toBe(expected);
});

test('withPlugin', () => {
  const output = getOutput('/fixtures/withplugin');
  const expected = readExpected('/fixtures/withplugin-expected');
  expect(output).toBe(expected);
});

test('withPlugin errors', () => {
  expect(() =>
    transform(`
    import {withPlugin} from "fusion-core";
    withPlugin;
    `)
  ).toThrowErrorMatchingSnapshot('bare');

  expect(() =>
    transform(`
    import {withPlugin} from "fusion-core";
    withPlugin.someProperty;
    `)
  ).toThrowErrorMatchingSnapshot('property');

  expect(() =>
    transform(`
    import {withPlugin} from "fusion-core";
    withPlugin.using(TokenA, TokenB);
    `)
  ).toThrowErrorMatchingSnapshot('.using without invocation');
});
