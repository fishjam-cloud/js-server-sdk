#!/bin/sh

# Usage:
# sh openapi.sh main
# sh openapi.sh v0.1.0

set -e

ROOTDIR=$(dirname $(dirname "$(readlink -f $0)"))

if [ -z "$1" ]; then
  echo "Missing a tag or a branch name as the first argument" 1>&2
  exit 1
fi

echo "Generating code for $1...\n"

cd $ROOTDIR \
&& npx openapi-generator-cli generate \
  -i https://raw.githubusercontent.com/fishjam-cloud/fishjam/$1/openapi.yaml \
  -g typescript-axios \
  -o src/openapi
