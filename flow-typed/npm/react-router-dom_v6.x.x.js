declare module "react-router-dom" {
  declare export type Location = {|
    pathname: string,
    search: string,
    hash: string,
  |};

  declare export type To = string | Location;

  declare export type Navigation = 'POP' | 'PUSH' | 'REPLACE';

  declare export type Navigator = {|
    action: string,
    location: Location,
    go(delta: number): void,
    push(to: TTo, state?: any): void,
    replace(path: TTo, state?: any): void,
    createHref(to: TTo): string,
    back(): void,
    forward(): void,
    listen(listener: any): () => void,
    block(blocker: any): () => void,
  |};

  declare export type RouterProps = {|
    basename?: string,
    children?: React$Node,
    location: string | Location,
    navigationType?: Navigation,
    navigator: Navigator,
    static?: boolean,
  |};

  declare export var Router: React$ComponentType<RouterProps>;

  declare export var Navigate: React$ComponentType<{|
    to: To,
    replace?: boolean,
    state?: any,
  |}>;

  declare export var Route: React$ComponentType<{|
    caseSensitive?: boolean;
    children?: React$Node,
    element?: React$Node | null,
    index?: boolean;
    path?: string;
  |}>;

  declare export var Routes: React$ComponentType<{|
    children?: React$Node,
    location?: To,
  |}>;

  declare export var useLocation: () => Location;

  declare export type RouteObject = {|
    caseSensitive?: boolean,
    children?: Array<RouteObject>,
    element?: React$Node,
    index?: boolean,
    path?: string,
  |};

  declare export var createRoutesFromChildren: (
    children: React$Node
  ) => Array<RouteObject>;

  declare export type RouteMatch = {|
    params: {[key: string]: string},
    pathname: string,
    route: RouteObject,
  |};

  declare export var matchRoutes: (
    routes: Array<RouteObject>,
    location: To,
    basename?: string,
  ) => Array<RouteMatch> | null;

  declare export var BrowserRouter: React$ComponentType<{|
    basename?: string,
    children?: React$Node,
    window?: Window
  |}>;

  declare export var unstable_HistoryRouter: React$ComponentType<{|
    basename?: string,
    children?: React$Node,
    history: Navigator,
  |}>;

  declare export var HashRouter: React$ComponentType<{|
    basename?: string,
    children?: React$Node,
    window?: Window
  |}>;

  declare export var MemoryRouter: React$ComponentType<{|
    basename?: string,
    children?: React$Node,
    initialEntries?: Array<To>,
    initialIndex?: number,
  |}>;

  declare export var Link: React$ComponentType<{|
    reloadDocument?: boolean;
    replace?: boolean;
    state?: any;
    to: To;
  |}>;

  declare export var NavLink: React$ComponentType<{|
    children?: React$Node,
    caseSensitive?: boolean,
    className?: string | Function,
    end?: boolean,
    style?: any,
  |}>;

  declare export var Outlet: React$ComponentType<{|
    context?: any,
  |}>;

  declare export var useOutletContext: () => any;

  declare export var StaticRouter: React$ComponentType<{|
    basename?: string,
    children?: React$Node,
    location: To;
  |}>;

  declare export var generatePath: (
    path: string,
    params: Object,
  ) => string;

  declare export var renderMatches: (
    matches: Array<RouteMatch> | null,
  ) => React$Element | null;

  declare export var matchPath: (
    pattern: any,
    pathname: string,
  ) => any;

  declare export var resolvePath: (
    to: To,
    fromPathname: string,
  ) => Location;

  declare export var useHref: (
    to: To
  ) => string;

  declare export var useLinkClickHandler: (
    to: To,
    options?: Object,
  ) => any;

  declare export var useInRouterContext: () => boolean;

  declare export var useNavigationType: () => Navigation;

  declare export var useMatch: (pattern: any) => any;

  declare export var useNavigate: () => any;

  declare export var useOutlet: () => React$Element | null;

  declare export var useParams: () => any;

  declare export var useResolvedPath: (to: To) => Location;

  declare export var useRoutes: (
    routes: Array<RouteObject>,
    location?: To
  ) => React$Element | null;

  declare export var useSearchParams: (defaultInit?: any) => [any, any];

  declare export var createSearchParams: (init?: any) => any;
}
