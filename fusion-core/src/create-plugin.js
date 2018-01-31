/* @flow */
export function createPlugin<Deps, Service>(
  opts: FusionPlugin<Deps, Service>
): FusionPlugin<Deps, Service> {
  // $FlowFixMe
  opts.__plugin__ = true;
  return opts;
}
