def filter_files(files):
  # Bazel doesn't support files that have spaces and other special characters in the filename
  # See also: https://github.com/bazelbuild/bazel/issues/374
  output = []
  for x in files:
    if x.path.find(" ") == -1:
      output.append(x)
  return output

