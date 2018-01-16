/* eslint-env node */
// @flow

import {parse} from 'url';
import type {Context} from 'fusion-core';

declare var __BROWSER__: boolean;

export function mockContext(url: string, options: *): Context {
  if (__BROWSER__) {
    const parsedUrl = {...parse(url)};
    const {path} = parsedUrl;
    parsedUrl.path = parsedUrl.pathname;
    parsedUrl.url = path;
    return {parsedUrl};
  }
  const httpMocks = require('node-mocks-http');
  const Stream = require('stream');
  const Koa = require('koa');
  let req = httpMocks.createRequest({url, ...options});
  let res = httpMocks.createResponse();

  /**
   * Copied from https://github.com/koajs/koa/blob/master/test/helpers/context.js
   * Copyright (c) 2016 Koa contributors
   * MIT License
   * https://github.com/koajs/koa/blob/master/LICENSE
   */
  const socket = new Stream.Duplex();
  //$FlowFixMe
  req = Object.assign({headers: {}, socket}, Stream.Readable.prototype, req);
  //$FlowFixMe
  res = Object.assign({_headers: {}, socket}, Stream.Writable.prototype, res);
  req.socket.remoteAddress = req.socket.remoteAddress || '127.0.0.1';
  res.getHeader = k => res._headers[k.toLowerCase()];
  res.setHeader = (k, v) => (res._headers[k.toLowerCase()] = v);
  res.removeHeader = k => delete res._headers[k.toLowerCase()];

  const app = new Koa();
  //$FlowFixMe
  const ctx = app.createContext(req, res);
  return ctx;
}

export function renderContext(url: string, options: any): Context {
  options = Object.assign(options, {headers: {accept: 'text/html'}});
  return mockContext(url, options);
}
