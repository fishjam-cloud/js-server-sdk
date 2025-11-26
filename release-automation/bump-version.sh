#!/bin/bash
set -e

# Usage: ./bump-version.sh <version>
VERSION="$1"

if [ -z "$GH_TOKEN" ]; then
    echo "Error: GH_TOKEN environment variable is not set"
    exit 1
fi

if [ -z "$VERSION" ]; then
    echo "Usage: $0 <version>"
    exit 1
fi

# Install asdf dependencies if .tool-versions exists
if [ -f .tool-versions ]; then
    echo "Installing asdf dependencies..."
    # add plugins from .tool-versions
    while read -r line; do
        PLUGIN_NAME=$(echo "$line" | awk '{print $1}')
        if ! asdf plugin list | grep -q "^$PLUGIN_NAME$"; then
            echo "Adding asdf plugin: $PLUGIN_NAME"
            asdf plugin add "$PLUGIN_NAME"
        else
            echo "asdf plugin $PLUGIN_NAME already added"
        fi
    done < .tool-versions
    
    asdf install
else
    echo ".tool-versions file not found!"
    exit 1
fi

# Create release branch
BRANCH_NAME="release-$VERSION"
git checkout -b "$BRANCH_NAME"


# Update root package.json
if [ -f package.json ]; then
    echo "Enabling corepack..."
    corepack enable
    corepack yarn version "$VERSION"
    echo "Updated root package.json to $VERSION"
else
    echo "Root package.json not found!"
    exit 1
fi

corepack yarn workspaces foreach version "$VERSION"


# Run proto generation
if corepack yarn gen:proto; then
    echo "Protos generated."
else
    echo "Proto generation failed!"
    exit 1
fi


# Run openapi codegen in fishjam-openapi
cd packages/fishjam-openapi

curl -H "Authorization: token $GH_TOKEN" \
-H "Accept: application/vnd.github.v3.raw" \
-L "https://raw.githubusercontent.com/fishjam-cloud/fishjam/main/openapi.yaml" \
-o openapi.yaml

npx @openapitools/openapi-generator-cli generate \
-i ./openapi.yaml \
-g typescript-axios \
-o ./src/generated

rm openapi.yaml
cd ../../

echo "✅ Version bump complete for $VERSION"
echo "BRANCH_NAME:$BRANCH_NAME"
