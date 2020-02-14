#!/bin/bash

# find dirname of cli.sh file
if [ -L "$0" ]
then
  BIN=$(dirname $(node -e "console.log(require('fs').realpathSync('$0'))"))
else
  BIN=$(dirname "$0")
fi

# find project root
findroot() {
  if [ -f "manifest.json" ]
  then
    echo "$PWD"
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
  "$BIN/download-bazelisk.sh"
fi

# setup other binaries
if [ ! -f "$ROOT/.bazelversion" ]
then
  USE_BAZEL_VERSION=$(cat "$BIN/../templates/scaffold/.bazelversion")
fi
"$BIN/bazelisk" run //:jazelle -- setup 2>/dev/null

NODE="$ROOT/bazel-bin/jazelle.runfiles/jazelle_dependencies/bin/node"
YARN="$ROOT/bazel-bin/jazelle.runfiles/jazelle_dependencies/bin/yarn.js"
JAZELLE="$ROOT/bazel-bin/jazelle.runfiles/jazelle/cli.js"

# if we can't find Bazel workspace, fall back to system node and jazelle's pinned yarn
if [ ! -f "$NODE" ] || [ ! -f "$YARN" ] || [ ! -f "$JAZELLE" ]
then
  # if we're in a repo, jazelle declaration in WORKSPACE is wrong, so we should error out
  if [ -f "$ROOT/WORKSPACE" ]
  then
    echo "Error: Invalid \`jazelle\` configuration in WORKSPACE file. Check the Jazelle download URL and the checksums for Node and Yarn"
    echo "Monorepo root: $ROOT"
    echo "Jazelle bin path root: $BIN"
    cat "$ROOT/WORKSPACE"
    echo "Node" $("$NODE" --version) "size:" $(wc -c "$NODE")
    echo "Yarn" $("$YARN" --version) "size:" $(wc -c "$YARN")
    echo "Jazelle" "size:" $(wc -c "$JAZELLE")
    echo "Bazel" "$BIN/bazelisk" version
    "$BIN/bazelisk" run //:jazelle -- setup
    echo "Attempting to use system Node/Yarn/Jazelle versions..."
  fi
  if [ ! -f "$BIN/yarn.js" ]
  then
    "$BIN/download-yarn.sh"
  fi
  NODE="$(which node)"
  YARN="$BIN/yarn.js"
  JAZELLE="$BIN/../cli.js"
fi

"$NODE" "$JAZELLE" "$@"
