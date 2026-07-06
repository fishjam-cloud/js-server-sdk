#!/bin/sh

# Usage:
# sh openapi.sh main <github-token>
# sh openapi.sh v0.1.0 <github-token>
# sh openapi.sh path/to/openapi.yaml

set -e

ROOTDIR=$(dirname "$(readlink -f $0)")

if [ -z "$1" ]; then
  echo "Missing a tag/branch name or a local spec file path as the first argument" 1>&2
  exit 1
fi

if [ -f "$1" ]; then
  SPEC=$(readlink -f "$1")
  echo "Generating code from local spec $SPEC...\n"
else
  if [ -z "$2" ]; then
    echo "Missing github token as the second argument" 1>&2
    exit 1
  fi
  SPEC="https://raw.githubusercontent.com/fishjam-cloud/fishjam/$1/openapi.yaml?token=$2"
  echo "Generating code for $1...\n"
fi

cd $ROOTDIR \
&& npx @openapitools/openapi-generator-cli generate \
  -i "$SPEC" \
  -g typescript-fetch \
  --additional-properties=modelPropertyNaming=original \
  --reserved-words-mappings public=public \
  -o ./src/generated
