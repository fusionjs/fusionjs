#!/usr/bin/env bash

PACKAGES=()

for row in $(cat manifest.json | jq -r '.projects[]'); do
  PACKAGES+=("../$row/yarn.lock")
done

if [ -d "./docker-cache" ]; then
  rm -rf docker-cache
fi;

mkdir docker-cache
cd docker-cache
node ../scripts/calculate-package-files.js "${PACKAGES[@]}"
cd ..

tar -czf packages.tar.gz docker-cache
buildkite-agent artifact upload packages.tar.gz
