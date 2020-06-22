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

  # setup other binaries
  BAZELISK_PATH="$ROOT/bazel-bin/jazelle.runfiles/jazelle/bin/bazelisk"
  if [ ! -f "$BAZELISK_PATH" ]
  then
    BAZELISK_PATH="$BIN/bazelisk"
  fi
  "$BAZELISK_PATH" --host_jvm_args=-Xmx15g run //:jazelle -- setup 2>/tmp/jazelle.log
}

TIME=$((time -p run) 2>&1 | grep real | awk '{print int(1000 * $2)}')
BOOTSTRAP_TIME=$TIME source "$ROOT/bazel-bin/jazelle.runfiles/jazelle/bin/cli.sh"