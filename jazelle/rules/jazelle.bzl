def _jazelle_impl(ctx):
  ctx.actions.write(
    output = ctx.outputs.executable,
    content = """
    export YARN=$(cd `dirname "{yarn}"` && pwd)/$(basename {yarn})
    NODE=$(cd `dirname "{node}"` && pwd)/$(basename {node})
    CLI=$(cd `dirname "{cli}"` && pwd)/$(basename {cli})
    CWD=`$NODE -e "console.log(require('path').dirname(require('fs').realpathSync('{manifest}')))"`
    ROOT=`$NODE -e "console.log(require('path').dirname(require('fs').realpathSync('{cli}')))"`
    if [ ! -d $ROOT/node_modules ]
    then
      $NODE $YARN --cwd $ROOT
    fi
    cd $CWD && $NODE $CLI $@
    """.format(
      node = ctx.files._node[0].path,
      yarn = ctx.files._yarn[0].path,
      manifest = ctx.files.manifest[0].path,
      cli = ctx.files._cli[0].path,
    )
  )
  runfiles = ctx.runfiles(files = ctx.files._node + ctx.files._yarn + ctx.files.manifest + ctx.files._files)
  return [
    DefaultInfo(
      runfiles = runfiles,
    )
  ]

jazelle = rule(
  implementation = _jazelle_impl,
  attrs = {
    "manifest": attr.label(
      allow_files = True,
    ),
    "_node": attr.label(
      executable = True,
      allow_files = True,
      cfg = "host",
      default = Label("@jazelle_dependencies//:node"),
    ),
    "_yarn": attr.label(
      executable = True,
      allow_files = True,
      cfg = "host",
      default = Label("@jazelle_dependencies//:yarn"),
    ),
    "_cli": attr.label(
      allow_files = True,
      default = Label("//:cli.js"),
    ),
    "_files": attr.label(
      allow_files = True,
      default = Label("//:files"),
    ),
  },
  executable = True,
)