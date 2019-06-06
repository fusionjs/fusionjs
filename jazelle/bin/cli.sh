BIN=`dirname $0`

# jazelle init is handled here outside of Bazel because scaffolding generates the Bazel files
# build, test and run are also run here to avoid calling bazel twice
if [ "$1" = "init" ] || [ "$1" = "build" ] || [ "$1" = "test" ] || [ "$1" = "run" ]
then
  # we only do minimal work to figure out cwd in these cases, so it's probably fine to use system node instead of hermetic node
  node $BIN/../cli.js $@
else
  # check if jazelle rules are declared
  if grep -q 'name = "jazelle"' BUILD.bazel 2>/dev/null
  then
    # bazelisk is installed by preinstall hook in package.json
    BAZELISK_PATH="${BAZELISK_PATH:-$BIN/bazelisk}"
    $BAZELISK_PATH run //:jazelle -- $@
  else
    (>&2 echo "Error: This folder is not a jazelle workspace. Run \`jazelle init\`") # print to stderr
    exit 1
  fi
fi
