load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")
http_archive(
  name = "jazelle",
  url = "https://registry.yarnpkg.com/jazelle/-/jazelle-0.0.0-canary.9d3d9dc.0.tgz",
  sha256 = "6cc894334793942d8b8dd2900d4115654e2af58fa86d47c74e00acf21772ccdd",
  strip_prefix = "package",
)

load("@jazelle//:workspace-rules.bzl", "jazelle_dependencies")
jazelle_dependencies(
  node_version = "12.13.0",
  node_sha256 = {
    "mac": "49a7374670a111b033ce16611b20fd1aafd3296bbc662b184fe8fb26a29c22cc",
    "linux": "7a57ef2cb3036d7eacd50ae7ba07245a28336a93652641c065f747adb2a356d9",
    "windows": "6f920cebeecb4957b4ef0def6d9b04c49d4582864f8d1a207ce8d0665865781a",
  },
  yarn_version = "1.19.1",
  yarn_sha256 = "fdbc534294caef9cc0d7384fb579ec758da7fc033392ce54e0e8268e4db24baf",
)
