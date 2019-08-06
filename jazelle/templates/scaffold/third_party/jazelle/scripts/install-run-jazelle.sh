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
TARBALL=$ROOT/third_party/jazelle/temp/jazelle.tgz
BIN=$ROOT/third_party/jazelle/temp
JAZELLE=$BIN/package/bin/cli.sh
if [ ! -f $JAZELLE ]
then
  curl -L "https://registry.yarnpkg.com/jazelle/-/jazelle-$VERSION.tgz" -o $TARBALL 2>/dev/null
  tar xzf $TARBALL -C $BIN
fi
$JAZELLE $@