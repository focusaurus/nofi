#!/usr/bin/env node
import childProcess from "node:child_process";
import { setupTTY, loadConfig, update, view } from "./lib.js";

let menuPath = process.argv[2];
let top;
try {
  top = loadConfig(menuPath);
} catch (error) {
  console.error(error);
  process.exit(10);
}
let model = { menuStack: [top], console, top };

function onKeypress(ch, key) {
  let actions;
  [model, actions] = update(model, ch, key);
  actions.forEach((action) => {
    switch (action.type) {
      case "spawn":
        childProcess.spawn(action.args[0], action.args.slice(1));
        break;
      case "message":
        console.log(action.message);
        break;
      case "exit":
        process.stdin.pause();
        process.exit();
    }
  });
  const ui = view(model);
  console.clear();
  console.log(ui);
}
setupTTY(process.stdin);
process.stdin.on("keypress", onKeypress);
console.log(view(model));
