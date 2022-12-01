// @flow
import type {TLocation, TTo} from '../types';

const addLeadingSlash = (path) => (path.charAt(0) === '/' ? path : '/' + path);

export const addRoutePrefix = (location: TTo, prefix: string): TTo => {
  if (!prefix) return location;
  if (typeof location === 'string') {
    return location.startsWith(prefix)
      ? location
      : `${prefix}${addLeadingSlash(location)}`;
  } else {
    return {
      ...location,
      pathname: location.pathname.startsWith(prefix)
        ? location.pathname
        : `${prefix}${addLeadingSlash(location.pathname)}`,
    };
  }
};

export const removeRoutePrefix = (
  location: TTo,
  prefix: string
): string | TLocation => {
  if (!prefix) return location;
  const pathname = typeof location === 'string' ? location : location.pathname;
  const hasPrefix = (pathname + '/').indexOf(prefix + '/') === 0;
  const unprefixedPathname = pathname.slice(prefix.length);
  const relativePathname = hasPrefix ? unprefixedPathname : pathname;

  if (typeof location === 'string') {
    return relativePathname;
  } else {
    return {
      ...location,
      pathname: relativePathname,
    };
  }
};
