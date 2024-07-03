#!/bin/sh

# Usage:
# sh openapi.sh main
# sh openapi.sh v0.1.0

set -e

ROOTDIR=$(dirname "$(readlink -f $0)")

if [ -z "$1" ]; then
  echo "Missing a tag or a branch name as the first argument" 1>&2
  exit 1
elif [ -z "$2" ]; then
  echo "Missing github token as as second argument" 1>&2
  exit 1
fi
echo "Generating code for $1...\n"

cd $ROOTDIR \
&& npx @openapitools/openapi-generator-cli generate \
  -i https://raw.githubusercontent.com/fishjam-cloud/fishjam/$1/openapi.yaml?token=$2 \
  -g typescript-axios \
  -o ./src/generated
