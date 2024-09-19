# VScode LSP To-Go

"One Language Server...To Go Please!"

Microsoft VSCode LSPs packaged as (unofficial) standalone npm packages:

- vscode-lsp-togo-css
- vscode-lsp-togo-eslint
- vscode-lsp-togo-html
- vscode-lsp-togo-json

## Why?

Microsoft has made some great LSP (Language Server Protocol) tools for VSCode. Saldy Microsoft has chosen to provide them only as part of VSCode or VSCode Extensions and not as a standalone package. Luckily many other editors (Zed, Neovim, Helix) have LSP support.

Package each language server with a [lightweight cli wrapper](cli.js) and bob's your uncle.

## See also

- [hrsh7th/vscode-langservers-extracted](https://github.com/hrsh7th/vscode-langservers-extracted) - Prior Art (extracted LSPs)
- [yioneko/vtsls](https://github.com/yioneko/vtsls) - LSP wrapper for VScode Typescript extension

## Future

Microsoft is going to greater lengths with their newer language servers to make them harder to use as a standalone package.

Perhaps in the future it will be possible to package:

- [vscode-markdown-languageserver](https://www.npmjs.com/package/vscode-markdown-languageserver) - NPM only, no GitHub repo. MIT licensed.
- [vscode-php-language-server](https://github.com/microsoft/vscode/tree/main/extensions/php-language-features)

If Microsoft ships standard NPM packages for these langauge, I will happily archive this project.

## License

This project is Copyright (c) Peter Tripp and available under the [MIT License](LICENSE).

VSCode is Copyright (c) Microsoft Corporation and available under the [MIT License](vscode/license.txt).
