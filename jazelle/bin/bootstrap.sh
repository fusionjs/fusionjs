#!/bin/bash

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
BIN=$(dirname $(realpath "$0"))

run() {
  # determine required bazel version
  if [ ! -f "$ROOT/.bazelversion" ]
  then
    USE_BAZEL_VERSION=$(cat "$BIN/../templates/scaffold/.bazelversion")
  fi

  BAZELISK_PATH="$ROOT/bazel-bin/jazelle.runfiles/jazelle/bin/bazelisk"
  if [ ! -f "$BAZELISK_PATH" ]
  then
    BAZELISK_PATH="$BIN/bazelisk"
  fi

  # if actual version is not the one listed in WORKSPACE, update
  ACTUAL_VERSION=$(cat "$ROOT/bazel-bin/jazelle.runfiles/jazelle/package.json" | grep version | awk '{print substr($2, 2, length($2) - 3)}')
  if ! grep "$ACTUAL_VERSION" "$ROOT/WORKSPACE" || [[ $ACTUAL_VERSION = "" ]] || [ ! -f "$ROOT/bazel-bin/jazelle.runfiles/jazelle/bin/cli.sh" ]
  then
    "$BAZELISK_PATH" --host_jvm_args=-Xmx15g run //:jazelle -- setup 2>/tmp/jazelle.log
  fi
}

TIME=$((time -p run) 2>&1 | grep real | awk '{print int(1000 * $2)}')

CLI="$ROOT/bazel-bin/jazelle.runfiles/jazelle/bin/cli.sh"
if [ ! -f $CLI ]
then
  CLI="$BIN/cli.sh"
fi

BOOTSTRAP_TIME="$TIME" source "$CLI"