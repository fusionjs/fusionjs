BUILD_FILE_CONTENT = """
package(default_visibility = ["//visibility:public"])
exports_files([
  "{node}",
  "{npm}",
  "{npx}",
  "{yarn}",
])
alias(name = "node", actual = "{node}")
alias(name = "npm", actual = "{npm}")
alias(name = "npx", actual = "{npx}")
alias(name = "yarn", actual = "{yarn}")
"""

ARCHITECTURES = {
  "mac os x": ("mac", "darwin", "tar.gz", "bin/node", "bin/npm", "bin/npx"),
  "linux": ("linux", "linux", "tar.xz", "bin/node", "bin/npm", "bin/npx"),
  "windows": ("windows", "win", "zip", "bin/node.exe", "bin/npm.cmd", "bin/npx.cmd"),
}
def _jazelle_dependencies_impl(ctx):
  os = ctx.os.name.lower()
  node_version = ctx.attr.node_version
  node_sha256 = ctx.attr.node_sha256
  label, arch, ext, node, npm, npx = ARCHITECTURES.get(os, "mac os x")

  ctx.download_and_extract(
    url = "https://nodejs.org/dist/v{version}/node-v{version}-{arch}-x64.{ext}".format(
      version = node_version,
      arch = arch,
      ext = ext,
    ),
    stripPrefix = "node-v{version}-{arch}-x64".format(
      version = node_version,
      arch = arch,
    ),
    sha256 = node_sha256[label],
  )

  yarn_version = ctx.attr.yarn_version
  yarn_sha256 = ctx.attr.yarn_sha256
  ctx.download(
    url = "https://github.com/yarnpkg/yarn/releases/download/v{version}/yarn-{version}.js".format(
      version = yarn_version,
    ),
    output = "bin/yarn.js",
    sha256 = yarn_sha256,
  )

  ctx.file(
    "BUILD.bazel",
    content = BUILD_FILE_CONTENT.format(
      node = node,
      npm = npm,
      npx = npx,
      yarn = "bin/yarn.js",
    )
  )

_jazelle_dependencies = repository_rule(
  implementation = _jazelle_dependencies_impl,
  attrs = {
    "node_version": attr.string(),
    "node_sha256": attr.string_dict(
      doc = """
A dict w/ `mac`, `linux`, and `windows` keys.

SHA256s can be found at https://nodejs.org/dist/v[version]/SHASUM256.txt

- node-v[version]-darwin-x64.tar.xz
- node-v[version]-linux-x64.tar.xz
- node-v[version]-win-x64.zip

Sample for Node 10.15.3

```
jazelle_dependencies(
  node_version = "10.15.3"
  node_sha256 = {
    "mac": "7a5eaa1f69614375a695ccb62017248e5dcc15b0b8edffa7db5b52997cf992ba",
    "linux": "faddbe418064baf2226c2fcbd038c3ef4ae6f936eb952a1138c7ff8cfe862438",
    "windows": "93c881fdc0455a932dd5b506a7a03df27d9fe36155c1d3f351ebfa4e20bf1c0d",
  }
)
```
"""
    ),
    "yarn_version": attr.string(),
    "yarn_sha256": attr.string(
      doc = """
SHA256 can be found via `curl -fLs https://github.com/yarnpkg/yarn/releases/download/v[version]/yarn-[version].js | openssl sha256`

Sample for Yarn 1.15.2

```
install_yarn(
  version = "1.15.2"
  sha256 = "7f2f5a90bfe3890bc4653432118ba627cb71a9000a5f60f16efebfc760501396"
)
```
"""
    ),
  },
)

def jazelle_dependencies(**kwargs):
  _jazelle_dependencies(name = "jazelle_dependencies", **kwargs)
