#!/bin/sh

PREFIX="vscode-lsp-togo"

set -e

if [ "$(node -v | sed 's/^v//' | cut -d. -f1)" -lt 20 ]; then
    echo "Node.js version must be 20.0.0 or greater" && exit 1
fi

for lang in css eslint html json; do
    rm -rf packages/lsp-togo-${lang}/dist
    mkdir -p packages/lsp-togo-${lang}/{dist,bin}
    cp src/cli.js packages/lsp-togo-${lang}/bin/vscode-lsp-togo-${lang}
done

# Extensions extracted from vscode repo
pushd upstream/vscode
    git clean -d -x -f
    npm install && npm run compile
    for lang in css html json; do
        cp -r extensions/${lang}-language-features/server/out/* ../../packages/lsp-togo-${lang}/dist/
    done
popd

# Eslint extension
pushd upstream/vscode-eslint
    npm install && npm run compile
    cp -r server/out/* ../../packages/lsp-togo-eslint/dist
popd

# Cleanup excess cruft
find packages/lsp-togo-*/dist -name "*.map" -type f -delete
rm -rf packages/lsp-togo-*/lib/browser
rm -rf packages/lsp-togo-*/lib/test

#
