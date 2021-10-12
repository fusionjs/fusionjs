load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")
http_archive(
  name = "jazelle",
  url = "https://registry.yarnpkg.com/jazelle/-/jazelle-0.0.0-canary.eea8cca.0.tgz",
  sha256 = "3e1915f8031fd763e980c4b1eaf4a218ebd97ff870d562e7e5aec8432b1bf54b",
  strip_prefix = "package",
)

load("@jazelle//:workspace-rules.bzl", "jazelle_dependencies")
jazelle_dependencies(
  node_version = "14.18.0",
  node_sha256 = {
    "mac": "6b9b4d60bcb4eba95488380be8c4da4af98fce3f4a01c9a76db881cbb736656d",
    "linux": "5c0bc18b19fd09ff80beb16772e69cb033ee4992a4ccd35bd884fd8f02e6d1ec",
    "windows": "2883e83ac3b1e1cb9a9bf65554043640849b39e86761e7c7ac50b664f42f20ff",
  },
  yarn_version = "1.19.1",
  yarn_sha256 = "fdbc534294caef9cc0d7384fb579ec758da7fc033392ce54e0e8268e4db24baf",
)
