// @flow
import type {LocationType} from '../types';

const addLeadingSlash = path => (path.charAt(0) === '/' ? path : '/' + path);

export const addRoutePrefix = (
  location: string | LocationType,
  prefix: string
): string | LocationType => {
  if (!prefix) return location;
  if (typeof location === 'string') {
    return `${prefix}${addLeadingSlash(location)}`;
  } else {
    return {
      ...location,
      pathname: `${prefix}${addLeadingSlash(location.pathname)}`,
    };
  }
};

export const removeRoutePrefix = (
  location: string | LocationType,
  prefix: string
): string | LocationType => {
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
