load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")
http_archive(
  name = "jazelle",
  url = "https://registry.yarnpkg.com/jazelle/-/jazelle-0.0.0-canary.2a2b83b.0.tgz",
  sha256 = "02838105dcaadcedaeeabcb03f931f6db87cdbb14e724d820ba11b6771030b76",
  strip_prefix = "package",
  patch_cmds = ["npm install"],
)

load("@jazelle//:workspace-rules.bzl", "jazelle_dependencies")
jazelle_dependencies(
  node_version = "10.16.0",
  node_sha256 = {
    "mac": "6c009df1b724026d84ae9a838c5b382662e30f6c5563a0995532f2bece39fa9c",
    "linux": "1827f5b99084740234de0c506f4dd2202a696ed60f76059696747c34339b9d48",
    "windows": "aa22cb357f0fb54ccbc06b19b60e37eefea5d7dd9940912675d3ed988bf9a059",
  },
  yarn_version = "1.16.0",
  yarn_sha256 = "a2cd728f8b7d041b8d3325520149ffd90ae1e1ab757307cdd377f4b081c9ca05",
)
