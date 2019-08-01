#!/usr/bin/env bash

# Copies all changed files into the private monorepo
# CAN DELETE ONCE MIGRATION IS COMPLETE

# Get the change set
SHA1="$(git rev-parse HEAD)"
SHA2="$(git rev-parse origin/master)"
CHANGES=$(git diff-tree --no-commit-id --name-only -r $SHA1 $SHA2)

for CHANGE in $CHANGES ; do (
  rsync -R $CHANGE "../../uber/fusionjs/public"
  echo "rsync -R $CHANGE \"../../uber/fusionjs/public\""
); done;
