// @flow

export function serialize(obj: any) {
  return encode(JSON.stringify(obj));
}

export function deserialize(str: string) {
  return parseJSONWithUndefined(decode(str));
}

export function parseJSONWithUndefined(str: string) {
  if (str === 'undefined') {
    return undefined;
  }
  return JSON.parse(str);
}

// Escaped characters inside strings can break JSON.parse
// Therefore, we encode backslashes

const encodeRegex = /[%\\]/g;
const encodeChars = {
  '\\': '%5C',
  '%': '%25',
};

// A minimalist URI encoding to save bytes
export function encode(str: string) {
  if (str === void 0) {
    return 'undefined';
  }
  return str.replace(encodeRegex, match => encodeChars[match]);
}

const decodeRegex = /(%5C)|(%25)/g;
const decodeChars = {
  '%5C': '\\',
  '%25': '%',
};

export function decode(str: string) {
  return str.replace(decodeRegex, match => decodeChars[match]);
}
