#!/bin/bash

DEFAULT_BAZEL_VERSION=2.1.0
DEFAULT_NODE_VERSION=12.16.1
DEFAULT_YARN_VERSION=1.22.0

# find dirname of cli.sh file
realpath() {
  DIR="$PWD"
  cd "$(dirname "$1")"
  LINK=$(readlink "$(basename "$1")")
  while [ "$LINK" ]
  do
    cd "$(dirname "$LINK")"
    LINK=$(readlink "$(basename "$1")")
  done
  echo "$PWD/$(basename "$1")"
  cd "$DIR"
}

BIN=$(dirname $(realpath "$0"))

if [ "$1" = "init" ]
then
  source "$BIN/init.sh"
else
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

  # determine required bazel version
  if [ ! -f "$ROOT/.bazelversion" ]
  then
    USE_BAZEL_VERSION=$(cat "$BIN/../templates/scaffold/.bazelversion")
  fi

  # setup bazelisk
  BAZELISK_PATH="$BIN/bazelisk"
  if [ "$BAZEL_PATH" = "" ]
  then
    BAZEL_PATH=$(which bazel)
  fi
  if [ "$BAZEL_PATH" != "" ]
  then
    COMPATIBLE_SYSTEM_BAZEL_VERSION=$("$BAZEL_PATH" version 2>/dev/null | grep "Build label: $USE_BAZEL_VERSION")
  fi
  if [ "$COMPATIBLE_SYSTEM_BAZEL_VERSION" != "" ]
  then
    # if system bazel exists and is the correct version, just use that
    ln -sf "$BAZEL_PATH" "$BAZELISK_PATH"
  fi

  # setup other binaries
  NODE="$ROOT/bazel-bin/jazelle.runfiles/jazelle_dependencies/bin/node"
  YARN="$ROOT/bazel-bin/jazelle.runfiles/jazelle_dependencies/bin/yarn.js"
  JAZELLE="$ROOT/bazel-bin/jazelle.runfiles/jazelle/cli.js"
  if [ ! -f "$NODE" ] || [ ! -f "$YARN" ] || [ ! -f "$JAZELLE" ]
  then
    time "$BAZELISK_PATH" --host_jvm_args=-Xmx15g run //:jazelle -- setup #2>/dev/null
  fi

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
      echo "Bazel" "$BAZELISK_PATH" version
      "$BAZELISK_PATH" --host_jvm_args=-Xmx15g run //:jazelle -- setup
      echo "Attempting to use system Node/Yarn/Jazelle versions..."
    fi
    NODE="$(which node)"
    YARN="$BIN/yarn.js"
    JAZELLE="$BIN/../cli.js"
  fi

  "$NODE" --max_old_space_size=65536 "$JAZELLE" "$@"
fi
