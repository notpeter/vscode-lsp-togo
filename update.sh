#!/bin/sh

set -e
#https://www.npmjs.com/package/vscode-markdown-languageserver

mkdir -p packages/lsp-togo-{css,eslint,html,json,php,markdown}/{dist,bin}


pushd upstream/vscode
    npm install && npm run compile
    for lang in css html json; do
        cp -r extensions/${lang}-language-features/server/out/* ../../packages/lsp-togo-${lang}/dist/
    done
    for lang in php markdown; do
        cp -r extensions/${lang}-language-features/out/* ../../packages/lsp-togo-${lang}/dist/
    done
popd

pushd upstream/vscode-eslint
    npm install && npm run compile
    cp -r server/out/* ../../packages/lsp-togo-eslint/dist
popd

find packages/lsp-togo-*/dist -name "*.map" -type f -delete
# rm -rf packages/lsp-togo-*/lib/browser
# rm -rf packages/lsp-togo-*/lib/test
