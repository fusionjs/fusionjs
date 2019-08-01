#!/bin/bash

# find project root
findroot() {
  if [ -f "manifest.json" ]
  then
    echo "$PWD/"
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
if ! hash jazelle 2>/dev/null
then
  yarn global add "jazelle@$VERSION" --ignore-engines
else
  if [ $(jazelle version) != "$VERSION" ]
  then
    yarn global upgrade "jazelle@$VERSION" --ignore-engines
  fi
fi
jazelle $@