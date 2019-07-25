def _web_binary_impl(ctx):
  out = ctx.outputs.executable

  deps = depset(
    direct = ctx.files._node + ctx.files._check,
    transitive = [dep[DefaultInfo].files for dep in ctx.attr.deps],
  )

  ctx.actions.write(
    output = ctx.outputs.executable,
    content = """
    CWD=$(cd `dirname {srcdir}` && pwd)
    NODE=$(cd `dirname "{node}"` && pwd)/$(basename {node})
    $NODE "{build}" "$CWD" "$(pwd)"
    """.format(
      node = ctx.files._node[0].path,
      srcdir = ctx.build_file_path,
      build = ctx.files._check[0].path,
    )
  )
  output = depset(direct = [out], transitive = [deps])
  runfiles = ctx.runfiles(files = output.to_list())
  return [
    DefaultInfo(
      runfiles = runfiles,
    )
  ]

flow_test = rule(
  implementation = _web_binary_impl,
  attrs = {
    "deps": attr.label_list(
      allow_files = True,
      default = [],
    ),
    "_node": attr.label(
      executable = True,
      allow_files = True,
      cfg = "host",
      default = Label("@jazelle_dependencies//:node"),
    ),
    "_check": attr.label(
      allow_files = True,
      default = Label("//:rules/flow-check.js"),
    )
  },
  test = True,
)
