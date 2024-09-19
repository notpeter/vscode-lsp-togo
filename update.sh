#!/bin/sh

PREFIX="vscode-lsp-togo"

set -euo pipefail

if [ "$(node -v | sed 's/^v//' | cut -d. -f1)" -lt 20 ]; then
    echo "Node.js version must be 20.0.0 or greater" && exit 1
fi

for lang in css eslint html json; do
    rm -rf packages/${PREFIX}-${lang}/dist
    mkdir -p packages/${PREFIX}-${lang}/dist
    cp src/cli.js packages/${PREFIX}-${lang}/bin/${PREFIX}-${lang}
done

# Extensions extracted from vscode repo
pushd upstream/vscode
    git clean -d -x -f
    npm install
    npm run compile
    for lang in css html json; do
        cp -r extensions/${lang}-language-features/server/out/* ../../packages/${PREFIX}-${lang}/dist/
    done
popd

# Eslint extension
pushd upstream/vscode-eslint
    npm install
    npm run compile
    cp -r server/out/* ../../packages/${PREFIX}-eslint/dist
popd

# Cleanup excess cruft
find packages/${PREFIX}-*/dist -name "*.map" -type f -delete
rm -rf packages/${PREFIX}-*/lib/browser
rm -rf packages/${PREFIX}-*/lib/test

# Check for missing dependencies
for lang in css eslint html json; do
    pushd packages/${PREFIX}-${lang}
        npm install
        npx depcheck
    popd
done
