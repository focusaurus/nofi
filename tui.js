#!/usr/bin/env node
import { setupTTY, loadConfig, update, view } from "./lib.js";

let menuPath = process.argv[2];
let top = loadConfig(menuPath);
let model = { menuStack: [top], console, top };

function onKeypress(ch, key) {
  model = update(model, ch, key);
  const message = view(model);
  // TODO switch on message and dispatch tag-out
}
setupTTY(process.stdin);
process.stdin.on("keypress", onKeypress);
view(model);
