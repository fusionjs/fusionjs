/* eslint-env node */

const httpMocks = require('node-mocks-http');
const Stream = require('stream');
const Koa = require('koa');

function mockContext(request) {
  let req = httpMocks.createRequest(Object.assign({url: '/'}, request));
  let res = httpMocks.createResponse();

  /**
   * Copied from https://github.com/koajs/koa/blob/master/test/helpers/context.js 
   * Copyright (c) 2016 Koa contributors
   * MIT License
   * https://github.com/koajs/koa/blob/master/LICENSE
   */
  const socket = new Stream.Duplex();
  req = Object.assign({headers: {}, socket}, Stream.Readable.prototype, req);
  res = Object.assign({_headers: {}, socket}, Stream.Writable.prototype, res);
  req.socket.remoteAddress = req.socket.remoteAddress || '127.0.0.1';
  res.getHeader = k => res._headers[k.toLowerCase()];
  res.setHeader = (k, v) => (res._headers[k.toLowerCase()] = v);
  res.removeHeader = k => delete res._headers[k.toLowerCase()];

  const app = new Koa();
  const ctx = app.createContext(req, res);
  return ctx;
}

mockContext.browser = request => {
  const ctx = mockContext(request);
  ctx.headers.accept = 'text/html';
  return ctx;
};

export default mockContext;
