// @flow
/* eslint-env node */

const path = require('path');
const WebSocket = require('ws');

const {dev, cmd, start} = require('../utils.js');

const dir = path.resolve(__dirname, './fixture');

jest.setTimeout(200000);

test('`fusion dev` works with websockets', async () => {
  const {proc, port} = await dev(`--dir=${dir}`);
  await new Promise((resolve) => {
    const client = new WebSocket(`ws://localhost:${port}/`);
    client.on('open', () => {
      client.send('hello');
    });
    client.on('error', (e) => {
      throw e;
    });
    client.on('message', (message) => {
      expect(message).toEqual('hello');
      client.close();
      proc.kill('SIGKILL');
      resolve();
    });
  });
});

test('`fusion build/start` works with websockets', async () => {
  await cmd(`build --dir=${dir}`);
  const {proc, port} = await start(`--dir=${dir}`);
  await new Promise((resolve) => {
    const client = new WebSocket(`ws://localhost:${port}/`);
    client.on('open', () => {
      client.send('hello');
    });
    client.on('error', (e) => {
      throw e;
    });
    client.on('message', (message) => {
      expect(message).toEqual('hello');
      client.close();
      proc.kill('SIGKILL');
      resolve();
    });
  });
});
