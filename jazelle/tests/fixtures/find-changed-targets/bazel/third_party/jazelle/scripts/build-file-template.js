// @flow
/*::
type TemplateArgs = {
  name: string,
  path: string,
  label: string,
  dependencies: Array<string>,
}
type Template = (TemplateArgs) => Promise<string>;
*/
const template /*: Template */ = async ({name, path, dependencies}) => `
package(default_visibility = ["//visibility:public"])

load("@jazelle//:build-rules.bzl", "web_library", "web_binary", "web_executable", "web_test", "flow_test")

web_library(
    name = "library",
    deps = [
        "//:node_modules",
        ${dependencies.map(d => `"${d}",`).join('\n        ')}
    ],
    srcs = glob(["**"], exclude = ["dist/**"]),
)

web_binary(
    name = "${name}",
    build = "build",
    command = "start",
    deps = [
        "//${path}:library",
    ],
    dist = ["dist"],
)

web_executable(
    name = "dev",
    command = "dev",
    deps = [
        "//${path}:library",
    ],
)

web_test(
    name = "test",
    command = "test",
    deps = [
        "//${path}:library",
    ],
)

web_test(
    name = "lint",
    command = "lint",
    deps = [
        "//${path}:library",
    ],
)

flow_test(
    name = "flow",
    deps = [
        "//${path}:library",
    ],
)`;

module.exports = {template};
