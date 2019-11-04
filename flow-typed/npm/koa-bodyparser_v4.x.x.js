// flow-typed signature: b3e03cc142350783579405795e1ac993
// flow-typed version: c6154227d1/koa-bodyparser_v4.x.x/flow_>=v0.56.x <=v0.103.x

declare module "koa-bodyparser" {
  declare type Context = Object;

  declare type Middleware = (
    ctx: Context,
    next: () => Promise<void>
  ) => Promise<void> | void;

  declare type Options = {|
    enableTypes?: Array<string>,
    encode?: string,
    formLimit?: string,
    jsonLimit?: string,
    strict?: boolean,
    detectJSON?: (ctx: Context) => boolean,
    extendTypes?: {
      json?: Array<string>,
      form?: Array<string>,
      text?: Array<string>
    },
    onerror?: (err: Error, ctx: Context) => void
  |};

  declare module.exports: (opts?: Options) => Middleware;
}
