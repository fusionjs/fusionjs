def _foo_impl(ctx):
  ctx.actions.write(
    output = ctx.outputs.output,
    content = "echo {name}".format(name = ctx.attr.name),
    is_executable = True,
  )
  return [
    DefaultInfo(
      executable = ctx.outputs.output
    )
  ]

foo_test = rule(
  implementation = _foo_impl,
  attrs = {
    "output": attr.output(),
  },
  test = True,
  executable = True,
)
