// flow-typed signature: 98c807575b9cbfd43579478e63b14c25
// flow-typed version: c6154227d1/just-safe-set_v2.1.x/flow_>=v0.98.x <=v0.103.x

declare module 'just-safe-set' {
  declare export default function set(
    obj: {[string]: mixed},
    key: string | Array<string> | Symbol,
    value: mixed
  ): boolean;
}
