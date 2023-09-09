#!/usr/bin/env node
import * as childProcess from "child_process";
import {
  setupTTY,
  loadConfig,
  update,
  view,
  Item,
  Action,
  Model,
  Keypress,
} from "./lib.js";

let menuPath = process.argv[2];
let top: Item;
try {
  top = loadConfig(menuPath);
} catch (error) {
  console.error(error);
  process.exit(10);
}
let model: Model = { menuStack: [top], console, top, menuPath, message: "" };

function onKeypress(ch: string, key: Keypress) {
  let actions: Action[];
  [model, actions] = update(model, ch, key);
  actions.forEach((action) => {
    switch (action.type) {
      case "run":
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
