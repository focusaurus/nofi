#!/usr/bin/env node
import { setupTTY, loadConfig, update, view } from "./lib.js";

let menuPath = process.argv[2];
let top = loadConfig(menuPath);
let model = { menuStack: [top], console, top };

function onKeypress(ch, key) {
  // TODO refactor view to also return an array of actions to trigger
  model = update(model, ch, key);
  const ui = view(model);
  console.clear();
  console.log(ui);
}
setupTTY(process.stdin);
process.stdin.on("keypress", onKeypress);
console.log(view(model));
