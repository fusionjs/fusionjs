#!/usr/bin/env bash

projects=$(cat manifest.json | jq -r '.projects[]')

generate() {
  echo "parsers:"
  echo "  javascript:"
  echo "    enable_partials: 'yes'"
  echo "coverage:"
  echo "  status:"
  echo "    project:"
  echo "      default: off"
  for project in $projects; do
    echo "      ${project}:"
    echo "        flags: ${project}"
  done
  echo "flags:"
  for project in $projects; do
    echo "  ${project}:"
    echo "    paths:"
    echo "      - ${project}"
  done
}

echo 'generating .codecov.yml from manifest.json'
generate > .codecov.yml
