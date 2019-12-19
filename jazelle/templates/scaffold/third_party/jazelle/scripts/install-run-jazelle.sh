#!/bin/bash

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

VERSION=$(grep -E -o "jazelle-(.+).tgz" "$ROOT/WORKSPACE")
VERSION=${VERSION:8:${#VERSION}-12}
BIN="$ROOT/third_party/jazelle/temp"
TARBALL="$BIN/jazelle.tgz"
JAZELLE="$BIN/package/bin/cli.sh"
if [ ! -f $JAZELLE ]
then
  mkdir -p "$BIN"
  curl -L "https://registry.yarnpkg.com/jazelle/-/jazelle-$VERSION.tgz" -o "$TARBALL"
  tar xzf "$TARBALL" -C "$BIN"
fi
"$JAZELLE" "$@"