// @flow

/* eslint-disable */

declare module 'node-fetch' {
  declare export default function fetch(
    url: string | Request,
    init?: RequestOptions
  ): Promise<Response>;
}
