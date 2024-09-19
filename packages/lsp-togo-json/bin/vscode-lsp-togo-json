#!/usr/bin/env node
const MIN_NODE = 'v20.0.0';
if (process.version < MIN_NODE) {
  console.error(`Node >={MIN_NODE} required`);
  process.exit(1);
}

const path = require("path");
const fs = require("fs");
const package_json = path.join(path.dirname(process.argv[1]), "..", "package.json");
const { name, version, main } = JSON.parse(fs.readFileSync(package_json, "utf8"));
const version_string = `${name} ${version} (node ${process.version}, ${process.execPath})`;
const command = process.argv.slice(2)[0];

switch (command) {
  case undefined:
  case "-h":
  case "--help":
    console.log(`Usage: lsp-togo-css [--stdio|--node-ipc|--socket=<number>]`);
    break;
  case "-v":
  case "-version":
  case "--version":
    console.log(version_string);
    break;
  default:
    console.error(`Starting ${version_string} with ${command}`);
    require(path.join(main));
    break;
}
