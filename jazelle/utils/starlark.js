// @flow

/*
FIXME dirty hack using regexps.
Ideally should use a real Python parser, but none of the readily available ones work,
and I don't want to spin up python instances just for parsing some simple function calls, so...

The functions below assume top-level function calls of the form:

  foo(
    arg = [
      "hello",
      "world",
    ],
  )

*/
const getCallMatcher = caller => new RegExp(`${caller}\\s*\\([^\\)]*\\)`, 'gi');
const getArgsMatcher = argName =>
  new RegExp(`${argName}\\s*=\\s*\\[(?:[^\\]]*)]`, 'im');
const getListMatcher = () => /\[([^\]]*)\]/;

function getCallArgItems(code, caller, argName) {
  let items = [];
  code.replace(getCallMatcher(caller), args => {
    args.replace(getArgsMatcher(argName), arg => {
      arg.replace(getListMatcher(), (_, list) => {
        items = list.split(',').map(item => item.replace(/,\s*$/, '').trim());
      });
    });
  });
  return items.filter(Boolean);
}

function addCallArgItem(code, caller, argName, value) {
  return code.replace(getCallMatcher(caller), args => {
    return args.replace(getArgsMatcher(argName), arg => {
      return arg.replace(getListMatcher(), (_, list) => {
        list = list.replace(/#.*$/gm, '');
        const [space] = list.match(/^\s*/) || [' '];
        const [dedent] = list.match(/\s*$/) || [' '];
        return `[${list.trimRight().replace(/,\s*$/, '')},${space ||
          ' '}${value},${dedent}]`.replace(/,]/, ']');
      });
    });
  });
}

function removeCallArgItem(code, caller, argName, value) {
  return code.replace(getCallMatcher(caller), args => {
    return args.replace(getArgsMatcher(argName), arg => {
      return arg.replace(getListMatcher(), (_, list) => {
        const dedent = list.match(/\s*$/) || ' ';
        const filtered = list
          .split(',')
          .filter(item => {
            return item.trim().replace(/,\s*$/, '') !== value;
          })
          .join(',');
        return `[${filtered.trimRight()}${dedent}]`;
      });
    });
  });
}

module.exports = {addCallArgItem, removeCallArgItem, getCallArgItems};
