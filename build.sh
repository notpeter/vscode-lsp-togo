#!/bin/sh

cd upstream/vscode
npm install
npm run compile
cd ../..
mkdir -p packages/lsp-togo-{css,html,json,markdown}/lib
cp -r upstream/vscode/extensions/css-language-features/server/out/* packages/lsp-togo-css/lib/
cp -r upstream/vscode/extensions/html-language-features/server/out/* packages/lsp-togo-html/lib/
cp -r upstream/vscode/extensions/json-language-features/server/out/* packages/lsp-togo-json/lib/
# cp -r upstream/vscode/extensions/markdown-language-features/out/* packages/lsp-togo-json/lib/

cd upstream/vscode-eslint
npm install
npm run compile
cd ../..
mkdir -p packages/lsp-togo-eslint/lib
cp -r upstream/vscode-eslint/server/out/* packages/lsp-togo-eslint/lib/
