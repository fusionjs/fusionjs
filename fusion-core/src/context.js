// @flow

import type {Context as KoaContext} from 'koa';

// Adapted from: https://github.com/fusionjs/fusion-core
type BaseContext = {
  element: Object,
};

// Adapted from: https://github.com/fusionjs/fusion-core
type BaseKoaContext = BaseContext & KoaContext;

// Adapted from: https://github.com/fusionjs/fusion-core
type SSRContext = {
  body: {
    htmlAttrs: Object,
    title: string,
    head: Array<string>,
    body: Array<string>,
  },
};

// TODO Web Platform | 2017-12-04 - Incorporate Koa and SSR contexts here.  Note currently does not work with gen-flow-files.
export type Context = BaseContext;
/*
  | BaseKoaContext
  | (BaseKoaContext & SSRContext);
  */
