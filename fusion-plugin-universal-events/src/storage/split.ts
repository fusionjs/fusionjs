// @flow
export function split<T>(arr: Array<T>, index: number): [Array<T>, Array<T>] {
  const a = arr.slice(0, index);
  const b = arr.slice(index);
  return [a, b];
}
