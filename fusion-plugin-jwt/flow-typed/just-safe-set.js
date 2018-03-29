// @flow

declare module 'just-safe-set' {
  declare export default function set(
    obj: mixed,
    key: string | Array<string>,
    value: mixed
  ): boolean;
}
