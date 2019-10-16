load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")
http_archive(
  name = "jazelle",
  url = "https://registry.yarnpkg.com/jazelle/-/jazelle-0.0.0-canary.34b9387.0.tgz",
  sha256 = "cb40e1db50fbd5679ee78627f8a615c8a94a259be45542af0dcdc61cd43a9e85",
  strip_prefix = "package",
  patch_cmds = ["npm install"],
)

load("@jazelle//:workspace-rules.bzl", "jazelle_dependencies")
jazelle_dependencies(
  node_version = "10.16.3",
  node_sha256 = {
    "mac": "1d5ce05abf39ef482c2c3eaf16c1f4edb01314308066871d3dfc99e95701b19b",
    "linux": "d2271fd8cf997fa7447d638dfa92749ff18ca4b0d796bf89f2a82bf7800d5506",
    "windows": "19aa47de7c5950d7bd71a1e878013b98d93871cc311d7185f5472e6d3f633146",
  },
  yarn_version = "1.19.1",
  yarn_sha256 = "fdbc534294caef9cc0d7384fb579ec758da7fc033392ce54e0e8268e4db24baf",
)
