/* @flow */
export function createPlugin<Deps, Service>(
  opts: $Exact<FusionPlugin<Deps, Service>>
): FusionPlugin<Deps, Service> {
  // $FlowFixMe
  opts.__plugin__ = true;
  return opts;
}
