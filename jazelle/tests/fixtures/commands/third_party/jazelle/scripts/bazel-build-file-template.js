module.exports.template = async ({name, path, dependencies}) => `
package(default_visibility = ["//visibility:public"])

load("@jazelle//:build-rules.bzl", "web_library", "web_binary", "web_test", "flow_test")

web_library(
    name = "library",
    deps = [
        "//third_party/jazelle:node_modules",
        ${dependencies.map(d => `"${d}",`).join('\n        ')}
    ],
    srcs = glob(["**/*"]),
)

web_binary(
    name = "${name}",
    command = "dev",
    deps = [
        "//${path}:library",
    ],
    dist = ["dist"],
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