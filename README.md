# LSP To-Go

Microsoft VSCode LSPs packaged as (unofficial) standalone npm packages:

| npm package       | binary                          |
| ----------------- | ------------------------------- |
| lsp-togo-css      | vscode-css-language-server      |
| lsp-togo-eslint   | vscode-eslint-language-server   |
| lsp-togo-html     | vscode-html-language-server     |
| lsp-togo-json     | vscode-json-language-server     |
| lsp-togo-markdown | vscode-markdown-language-server |

See also:

- [vtsls](https://github.com/yioneko/vtsls) - LSP wrapper for VScode Typescript extension

## Why?

Microsoft has made some great LSP (Language Server Protocol) tools for VSCode. Saldy Microsoft has chosen to provide them only as part of VSCode or VSCode Extensions and not as a standalone package. Luckily many other editors (Zed, Neovim, Helix) have LSP support and so we just need to create standalone packages for each.

## License

This project is Copyright (c) Peter Tripp and available under the [MIT License](LICENSE).

VSCode is Copyright (c) Microsoft Corporation and available under the [MIT License](vscode/license.txt).
