#!/usr/bin/env bash

projects=$(cat manifest.json | jq -r '.projects[]')

# $1 is amount of indent to use
generate_projects() {
  for project in $projects; do
    echo "${1}${project}:"
    echo "${1}  flags: ${project}"
  done
}

# $1 is amount of indent to use
generate_flags() {
  for project in $projects; do
    echo "${1}${project}:"
    echo "${1}  paths:"
    echo "${1}    - ${project}"
  done
}

generate_codecov() {
  echo "parsers:"
  echo "  javascript:"
  echo "    enable_partials: 'yes'"
  echo "coverage:"
  echo "  status:"
  echo "    project:"
  echo "      default: off"
  generate_projects '      '
  echo "flags:"
  generate_flags '  '
}

generate_codecov > .codecov.yml
