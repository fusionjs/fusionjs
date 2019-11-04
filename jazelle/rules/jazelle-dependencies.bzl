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

SHA256s can be found at https://nodejs.org/dist/v[version]/SHASUMS256.txt

- node-v[version]-darwin-x64.tar.xz
- node-v[version]-linux-x64.tar.xz
- node-v[version]-win-x64.zip

Sample for Node 10.16.3

```
jazelle_dependencies(
  node_version = "10.16.3"
  node_sha256 = {
    "mac": "6febc571e1543c2845fa919c6d06b36a24e4e142c91aedbe28b6ff7d296119e4",
    "linux": "d2271fd8cf997fa7447d638dfa92749ff18ca4b0d796bf89f2a82bf7800d5506",
    "windows": "19aa47de7c5950d7bd71a1e878013b98d93871cc311d7185f5472e6d3f633146",
  }
)
```
"""
    ),
    "yarn_version": attr.string(),
    "yarn_sha256": attr.string(
      doc = """
SHA256 can be found via `curl -fLs https://github.com/yarnpkg/yarn/releases/download/v[version]/yarn-[version].js | openssl sha256`

Sample for Yarn 1.19.1

```
install_yarn(
  version = "1.19.1"
  sha256 = "fdbc534294caef9cc0d7384fb579ec758da7fc033392ce54e0e8268e4db24baf"
)
```
"""
    ),
  },
)

def jazelle_dependencies(**kwargs):
  _jazelle_dependencies(name = "jazelle_dependencies", **kwargs)
