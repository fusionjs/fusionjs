#!/bin/bash

# init command should bootstrap with bash only
# it should not rely on bazel or node since we only want to install them based on the versions listed in scaffold

DEFAULT_BAZEL_VERSION=2.1.0
DEFAULT_NODE_VERSION=12.16.1
DEFAULT_YARN_VERSION=1.22.0

if [ "$2" = "--help" ]
then
  echo "
Initializes a workspace

--bazel [bazel]                Bazel version. Defaults to $DEFAULT_BAZEL_VERSION
--node [node]                  Node version. Defaults to $DEFAULT_NODE_VERSION
--yarn [yarn]                  Yarn version. Defaults to $DEFAULT_YARN_VERSION
  "
else
  cp -r "$BIN/../templates/scaffold/." "./"

  MATCH=$(grep 'version' "$BIN/../package.json")
  JAZELLE_VERSION=${MATCH:14:${#MATCH}-16}
  TMP=$(sed "s/JAZELLE_VERSION/$JAZELLE_VERSION/" WORKSPACE) && echo "$TMP" > WORKSPACE

  while (( "$#" ))
  do
    KEY=$2; shift; VALUE=$2; shift;
    case "$KEY" in
      "--bazel")
        TMP=$(sed "s/BAZEL_VERSION/$VALUE/" .bazelversion) && echo "$TMP" > .bazelversion ;;
      "--node")
        TMP=$(sed "s/NODE_VERSION/$VALUE/" WORKSPACE) && echo "$TMP" > WORKSPACE ;;
      "--yarn")
        TMP=$(sed "s/YARN_VERSION/$VALUE/" WORKSPACE) && echo "$TMP" > WORKSPACE ;;
    esac
  done
  TMP=$(sed "s/BAZEL_VERSION/$DEFAULT_BAZEL_VERSION/" .bazelversion) && echo "$TMP" > .bazelversion
  TMP=$(sed "s/NODE_VERSION/$DEFAULT_NODE_VERSION/" WORKSPACE) && echo "$TMP" > WORKSPACE
  TMP=$(sed "s/YARN_VERSION/$DEFAULT_YARN_VERSION/" WORKSPACE) && echo "$TMP" > WORKSPACE
fi