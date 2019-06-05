// @flow
module.exports.template = ({name, path, label, dependencies}) => `
#
# name: ${name}
# path: ${path}
# label: ${label}
# dependencies: ${dependencies.join('|')}
#`;
