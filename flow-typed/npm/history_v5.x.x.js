declare module 'history' {
  declare export type Location = {|
    pathname: string,
    search: string,
    hash: string,
  |};

  declare export type To = string | Location;

  declare export type History = {|
    action: string,
    location: Location,
    go(delta: number): void,
    push(to: To, state?: any): void,
    replace(path: To, state?: any): void,
    createHref(to: To): string,
    back(): void,
    forward(): void,
    listen(listener: any): () => void,
    block(blocker: any): () => void,
  |};

  declare type BrowserHistoryOpts = {
    window?: Window,
  };

  declare function createBrowserHistory(
    opts?: BrowserHistoryOpts
  ): History;

  declare type CreatePathOpts = {
    pathname?: string,
    search?: string,
    hash?: string,
  };

  declare function createPath(
    opts: CreatePathOpts
  ): string;

  declare function parsePath(
    path: string
  ): Location;
}
