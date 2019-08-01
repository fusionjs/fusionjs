#!/usr/bin/env bash

# jazelle installs every package to generate the yarn.lock file
# CAN DELETE ONCE MIGRATION IS COMPLETE

if [ "$1" == "--reset" ]; then
  # Reset jazelle
  jazelle purge

  # Delete all lock files
  for row in $(cat manifest.json | jq -r '.projects[]'); do
    pushd $row
    rm yarn.lock
    popd
  done
fi

# Install everything
for row in $(cat manifest.json | jq -r '.projects[]'); do
  echo "====================================================================="
  echo "++++++ Now processing $row"
  echo "====================================================================="

  pushd $row
  if [ -f ./yarn.lock ]; then
    echo "Lock file already exists! Skipping..."
  else
    jazelle install
  fi
  popd
done
