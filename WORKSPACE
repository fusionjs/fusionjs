load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")
http_archive(
  name = "jazelle",
  url = "https://registry.yarnpkg.com/jazelle/-/jazelle-0.0.0-canary.eea8cca.0.tgz",
  sha256 = "3e1915f8031fd763e980c4b1eaf4a218ebd97ff870d562e7e5aec8432b1bf54b",
  strip_prefix = "package",
)

load("@jazelle//:workspace-rules.bzl", "jazelle_dependencies")
jazelle_dependencies(
  node_version = "14.15.1",
  node_sha256 = {
    "mac": "9154d9c3f598d3efe6d163d160a7872ddefffc439be521094ccd528b63480611",
    "linux": "608732c7b8c2ac0683fee459847ad3993a428f0398c73555b9270345f4a64752",
    "windows": "cb1ec98baf6f19e432250573c9aba9faa6b4104517b6a49b05aa5f507f6763fd",
  },
  yarn_version = "1.19.1",
  yarn_sha256 = "fdbc534294caef9cc0d7384fb579ec758da7fc033392ce54e0e8268e4db24baf",
)
