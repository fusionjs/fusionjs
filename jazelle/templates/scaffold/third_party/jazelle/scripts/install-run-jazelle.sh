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
BOOTSTRAP_DIR=$ROOT/third_party/jazelle/temp/jazelle
JAZELLE=$BOOTSTRAP_DIR/node_modules/.bin/jazelle
mkdir -p $BOOTSTRAP_DIR
if [ ! -f $BOOTSTRAP_DIR/package.json ]
then
  echo '{}' > $BOOTSTRAP_DIR/package.json
fi
if [ ! -f $JAZELLE ]
then
  (cd $BOOTSTRAP_DIR && npm install "jazelle@$VERSION")
else
  if [ $($JAZELLE version) != "$VERSION" ]
  then
    (cd $BOOTSTRAP_DIR && npm install "jazelle@$VERSION")
  fi
fi
$JAZELLE $@