#!/bin/sh

# Usage:
# sh openapi.sh path/to/openapi.json

set -e

ROOTDIR=$(dirname "$(readlink -f $0)")

if [ -z "$1" ]; then
  echo "Missing a local openapi.json path as the first argument" 1>&2
  exit 1
fi

SPEC=$(readlink -f "$1")

cd $ROOTDIR \
&& npx @openapitools/openapi-generator-cli generate \
  -i "$SPEC" \
  -g typescript-fetch \
  --additional-properties=modelPropertyNaming=camelCase \
  --reserved-words-mappings public=public \
  --global-property=apiDocs=false,modelDocs=false \
  -o ./src/generated

sed -i.bak \
  "s/objectToJSON(requestParameters\['config'\])/RegisterOutputToJSON(requestParameters['config'])/" \
  ./src/generated/apis/OutputsApi.ts
rm ./src/generated/apis/OutputsApi.ts.bak
