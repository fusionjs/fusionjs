export const formatApiPath = (apiPath: string): string =>
  `/${apiPath}/`.replace(/\/{2,}/g, '/');
