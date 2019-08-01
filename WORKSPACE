load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")
http_archive(
  name = "jazelle",
  url = "https://registry.yarnpkg.com/jazelle/-/jazelle-0.0.0-canary.a8af54e.0.tgz",
  strip_prefix = "package",
  patch_cmds = ["npm install"],
)

load("@jazelle//:workspace-rules.bzl", "jazelle_dependencies")
jazelle_dependencies(
  node_version = "10.16.0",
  node_sha256 = {
    "mac": "7a5eaa1f69614375a695ccb62017248e5dcc15b0b8edffa7db5b52997cf992ba",
    "linux": "faddbe418064baf2226c2fcbd038c3ef4ae6f936eb952a1138c7ff8cfe862438",
    "windows": "93c881fdc0455a932dd5b506a7a03df27d9fe36155c1d3f351ebfa4e20bf1c0d",
  },
  yarn_version = "1.15.2",
  yarn_sha256 = "7f2f5a90bfe3890bc4653432118ba627cb71a9000a5f60f16efebfc760501396",
)
