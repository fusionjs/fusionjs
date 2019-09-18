#!/usr/bin/env bash

DIR=$1
PACKAGE=$2
filepath="$DIR/coverage/coverage-final.json"

if [[ -e $filepath ]]; then
  echo 'coverage file found; uploading...'
  bash <(curl -s https://codecov.io/bash) -f $filepath -F $PACKAGE
else
  echo 'no coverage file found; skipping upload'
fi;
