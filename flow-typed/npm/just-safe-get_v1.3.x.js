// flow-typed signature: 8a3ff877cc20f65ecbd3170dc67175bb
// flow-typed version: c6154227d1/just-safe-get_v1.3.x/flow_>=v0.98.x <=v0.103.x

declare module 'just-safe-get' {
  declare export default function get(
    obj: mixed,
    key: string | Array<string>
  ): mixed;

  declare export default function get<TReturn>(
    obj: mixed,
    key: string | Array<string>
  ): TReturn;
}
