# find dirname of cli.sh file
if [ -L "$0" ]
then
  BIN=$(dirname $(node -e "console.log(fs.realpathSync('$0'))"))
else
  BIN=$(dirname "$0")
fi

# find project root
findroot() {
  if [ -f "WORKSPACE" ]
  then
    echo "$PWD/WORKSPACE"
  elif [ "$PWD" = "/" ]
  then
    echo ""
  else
    # a subshell so that we don't affect the caller's $PWD
    (cd .. && findroot)
  fi
}
ROOT=$(findroot)

# setup bazelisk
if [ ! -f "$BIN/bazelisk" ]
then
  "$NODE" "$BIN/../utils/download-bazelisk.js"
fi

# setup other binaries
if [ -d "$ROOT" ] && [ ! -d "$ROOT/bazel-bin/jazelle.runfiles/jazelle_dependencies" ]
then
  echo "Setting up Bazel, Node and Yarn"
  # trigger Bazel repository rules to download node and yarn
  # then print bazel version info
  "$BIN/bazelisk" run //:jazelle bazel version
fi

NODE="$ROOT/bazel-bin/jazelle.runfiles/jazelle_dependencies/bin/node"
YARN="$ROOT/bazel-bin/jazelle.runfiles/jazelle_dependencies/bin/yarn.js"
JAZELLE="$ROOT/bazel-bin/jazelle.runfiles/jazelle"

# if we can't find Bazel workspace, fall back to system node and jazelle's pinned yarn
if [ ! -f "$NODE" ] || [ ! -f "$YARN" ] || [ ! -d "$JAZELLE" ]
then
  if [ ! -f "$BIN/yarn.js" ]
  then
    "$NODE" "$BIN/../utils/download-yarn.js"
  fi
  NODE="$(which node)"
  YARN="" # see utils/binary-paths.js for fallback path, see also package.json
  JAZELLE="$BIN/.."
fi

"$NODE" "$JAZELLE/cli.js" $@

