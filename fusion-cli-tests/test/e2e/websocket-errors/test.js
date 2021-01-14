// @flow
/* eslint-env node */

const path = require('path');
const WebSocket = require('ws');
const request = require('axios');

const {dev, cmd, start} = require('../utils.js');

const dir = path.resolve(__dirname, './fixture');

jest.setTimeout(200000);

test('`fusion dev` handles websocket failures', async () => {
  const {proc, port} = await dev(`--dir=${dir}`);
  await new Promise(resolve => {
    const client = new WebSocket(`ws://localhost:${port}/`);
    client.on('open', () => {
      client.send('hello');
    });
    client.on('error', async e => {
      const resp = await request(`http://localhost:${port}/health`);
      expect(resp).toBeTruthy();
      client.close();
      proc.kill('SIGKILL');
      resolve();
    });
  });
});

test('`fusion build/start` handles websocket failures', async () => {
  await cmd(`build --dir=${dir}`);
  const {proc, port} = await start(`--dir=${dir}`);
  await new Promise(resolve => {
    const client = new WebSocket(`ws://localhost:${port}/`);
    client.on('open', () => {
      client.send('hello');
    });
    client.on('error', async e => {
      const resp = await request(`http://localhost:${port}/health`);
      expect(resp).toBeTruthy();
      client.close();
      proc.kill('SIGKILL');
      resolve();
    });
  });
});
